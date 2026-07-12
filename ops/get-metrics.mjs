// ops/get-metrics.mjs
//
// Linux/Node port of ops/get-metrics.ps1 (KR1-2): collect metrics and append
// one row each to docs/company/metrics/{awareness,funnel,ops-health}-log.csv.
// The old PowerShell collector stubbed credentialed sources; this port wires
// the real ones now that the host holds the full env (2026-07-11 migration):
//
//   A4/A5/A6  <- GSC via ops/gsc-pull.mjs --json (read-only service account)
//   A7        <- parsed from metrics/backlink-ledger.md
//   F1-F4/R1  <- Firebase Admin read-only Firestore fetch (counts only —
//                never prints doc contents; never writes to Firestore)
//   H1/H3     <- newest ops/logs/site-check-*.json (the Linux shared probe
//                writes the JSON but not the CSV row, so this logs it)
//   A1/A2/A3  <- still n/a (GA4 / WP analytics / GSC index count not wired)
//
// Any source failure degrades that field to "n/a - <reason>" — a row is ALWAYS
// appended (a logged "no data" still proves the run measured). Exit 1 only if
// appending itself fails.
//
// Usage:
//   node ops/get-metrics.mjs                    # collect + append all rows
//   node ops/get-metrics.mjs --dry-run          # print rows, append nothing
//   node ops/get-metrics.mjs --run-type probe   # ops-health run_type label

import { readFileSync, existsSync, appendFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { computeFunnel, tsMs } from './lib/funnel-metrics.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const METRICS_DIR = path.join(ROOT, 'docs/company/metrics');
const LOG_DIR = path.join(ROOT, 'ops/logs');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const runType = args[args.indexOf('--run-type') + 1] && args.includes('--run-type')
  ? args[args.indexOf('--run-type') + 1]
  : 'probe';

function loadEnvLocal() {
  const f = path.join(ROOT, '.env.local');
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnvLocal();

const now = new Date();
const dateUtc = now.toISOString().slice(0, 10);
const stampUtc = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

// ---- A7: do-follow backlinks from the ledger --------------------------------
function countBacklinks() {
  const ledger = path.join(METRICS_DIR, 'backlink-ledger.md');
  if (!existsSync(ledger)) return 0;
  const matches = readFileSync(ledger, 'utf8').match(/\|\s*yes\s*\|/gi);
  return matches ? matches.length : 0;
}

// ---- A4/A5/A6: GSC via gsc-pull.mjs -----------------------------------------
function pullGsc() {
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, 'ops/gsc-pull.mjs'), '--json'], {
      encoding: 'utf8',
      timeout: 60000,
    });
    const j = JSON.parse(out);
    return {
      a4: j.impressions,
      a5: j.clicks,
      a6: j.position,
      note: `GSC ${j.range.startDate}..${j.range.endDate}: ${j.queries_non_branded} non-branded of ${j.queries_total} queries, CTR ${j.ctr}%`,
    };
  } catch (e) {
    const reason = String(e.message || e).split('\n')[0].slice(0, 120);
    return { a4: `n/a - GSC pull failed`, a5: 'n/a', a6: 'n/a', note: `GSC error: ${reason}` };
  }
}

// ---- F1-F4/R1: Firebase Admin read-only fetch --------------------------------
async function pullFunnel() {
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Firebase Admin env vars missing');
    }
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    const db = getFirestore();
    // Full collection scans are deliberate: user base is small (~52 auth users)
    // and it keeps every aggregate computable without composite indexes.
    const [pSnap, lSnap, mSnap] = await Promise.all([
      db.collection('pitchers').select('createdAt', 'credit_balance').get(),
      db.collection('listeners').select('createdAt').get(),
      db.collection('meetings').select('createdAt', 'status', 'respondedAt', 'pitcherId').get(),
    ]);
    const data = {
      pitchers: pSnap.docs.map((d) => ({
        id: d.id,
        createdAtMs: tsMs(d.get('createdAt')),
        creditBalance: Number(d.get('credit_balance')) || 0,
      })),
      listeners: lSnap.docs.map((d) => ({ id: d.id, createdAtMs: tsMs(d.get('createdAt')) })),
      meetings: mSnap.docs.map((d) => ({
        createdAtMs: tsMs(d.get('createdAt')),
        status: d.get('status'),
        respondedAtMs: tsMs(d.get('respondedAt')),
        pitcherId: d.get('pitcherId'),
      })),
    };
    const f = computeFunnel(data, now.getTime());
    return {
      ...f,
      note: `Firebase Admin live read: ${data.pitchers.length} pitcher / ${data.listeners.length} listener docs, ${data.meetings.length} meetings total; defs per ops/lib/funnel-metrics.mjs`,
    };
  } catch (e) {
    const reason = String(e.message || e).split('\n')[0].slice(0, 120);
    return {
      F1: 'n/a', F2: 'n/a', F3: 'n/a', F4: 'n/a', R1: 'n/a',
      note: `Firebase Admin read failed: ${reason}`,
    };
  }
}

// ---- H1/H3: newest site-check artifact ---------------------------------------
function readProbe() {
  try {
    const files = readdirSync(LOG_DIR).filter((f) => /^site-check-.*\.json$/.test(f)).sort();
    if (!files.length) return { h1: 'fail', h2: 'no-probe-artifact', h3: 'FAIL', note: 'no site-check artifact found' };
    const newest = files[files.length - 1];
    const j = JSON.parse(readFileSync(path.join(LOG_DIR, newest), 'utf8'));
    const pass = j.overall === 'pass' || j.allOk === true; // linux + legacy PS formats
    const probeTs = (j.timestamp || j.ts || '').replace(/[TZ]/g, '');
    const ageMs = probeTs
      ? now.getTime() - Date.parse(
          `${probeTs.slice(0, 4)}-${probeTs.slice(4, 6)}-${probeTs.slice(6, 8)}T${probeTs.slice(8, 10)}:${probeTs.slice(10, 12)}:${probeTs.slice(12, 14)}Z`
        )
      : Infinity;
    const stale = !(ageMs < 4 * 3600000); // > 1 run interval + slack
    return {
      h1: pass ? 'success' : 'fail',
      h2: pass ? 'none' : 'probe-fail',
      h3: pass ? 'pass' : 'FAIL',
      note: `critical-path probe (${newest}${stale ? ', STALE >4h' : ''})`,
    };
  } catch (e) {
    return { h1: 'fail', h2: 'probe-artifact-unreadable', h3: 'FAIL', note: String(e.message || e).slice(0, 120) };
  }
}

// ---- collect + append ---------------------------------------------------------
const a7 = countBacklinks();
const gsc = pullGsc();
const funnel = await pullFunnel();
const probe = readProbe();

const q = (s) => `"${String(s).replace(/"/g, "'")}"`;
const awarenessRow = `${dateUtc},n/a,n/a,n/a,${gsc.a4},${gsc.a5},${gsc.a6},${a7},${q(`${gsc.note}; A1/A2 n/a (GA4/WP analytics unwired); A3 n/a (GSC UI only); A7 from ledger`)}`;
const funnelRow = `${dateUtc},${funnel.F1},${funnel.F2},${funnel.F3},${funnel.F4},${funnel.R1},${q(funnel.note)}`;
const opsRow = `${stampUtc},${runType},${probe.h1},${probe.h2},${probe.h3},not-run,${q(probe.note)}`;

if (dryRun) {
  console.log(`[dry-run] awareness: ${awarenessRow}`);
  console.log(`[dry-run] funnel:    ${funnelRow}`);
  console.log(`[dry-run] ops:       ${opsRow}`);
  process.exit(0);
}

try {
  appendFileSync(path.join(METRICS_DIR, 'awareness-log.csv'), awarenessRow + '\n');
  appendFileSync(path.join(METRICS_DIR, 'funnel-log.csv'), funnelRow + '\n');
  appendFileSync(path.join(METRICS_DIR, 'ops-health-log.csv'), opsRow + '\n');
  console.log(`Appended metric rows for ${dateUtc} (A4=${gsc.a4} A5=${gsc.a5} A7=${a7}; F1=${funnel.F1} F2=${funnel.F2} F3=${funnel.F3} F4=${funnel.F4} R1=${funnel.R1}; probe=${probe.h3}).`);
  process.exit(0);
} catch (e) {
  console.error(`ERROR appending metric rows: ${e.message}`);
  process.exit(1);
}
