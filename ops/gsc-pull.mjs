// ops/gsc-pull.mjs
//
// Pull Google Search Console metrics for donatalk.com using a service-account
// key (read-only). No external dependencies — signs the OAuth JWT with node's
// crypto and calls the Search Console API with fetch.
//
// Setup: service-account JSON key path in .env.local as GSC_SA_KEY_FILE, and the
// service account added as a (Restricted) user on the GSC property.
//
// Usage:
//   node ops/gsc-pull.mjs                       # 28d, sc-domain:donatalk.com
//   node ops/gsc-pull.mjs --days 90 --json      # 90d, machine-readable output

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const days = Number((args[args.indexOf('--days') + 1]) || 28) || 28;
const site = args.find((a) => a.startsWith('sc-domain:') || a.startsWith('http')) || 'sc-domain:donatalk.com';

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

async function getAccessToken(keyPath) {
  const key = JSON.parse(readFileSync(keyPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: key.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const sig = signer.sign(key.private_key).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const jwt = `${header}.${claims}.${sig}`;

  const res = await fetch(key.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`token ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j.access_token;
}

async function query(token, body) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`query ${res.status}: ${JSON.stringify(j).slice(0, 400)}`);
  return j;
}

const keyPath = path.resolve(ROOT, process.env.GSC_SA_KEY_FILE || 'gsc-sa.json');
if (!existsSync(keyPath)) {
  console.error(`ERROR: key file not found: ${keyPath} (set GSC_SA_KEY_FILE in .env.local)`);
  process.exit(2);
}

const end = new Date();
const start = new Date(Date.now() - (days - 1) * 86400000);
const range = { startDate: ymd(start), endDate: ymd(end) };

const BRANDED = /don|dona|dna|down\s*talk|tak|talksx/i; // DonaTalk + common misspellings

try {
  const token = await getAccessToken(keyPath);
  const totals = await query(token, { ...range, dimensions: [] });
  const byQuery = await query(token, { ...range, dimensions: ['query'], rowLimit: 100 });

  const t = (totals.rows && totals.rows[0]) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const rows = byQuery.rows || [];
  const nonBranded = rows.filter((r) => !BRANDED.test(r.keys[0]));

  const out = {
    site,
    range,
    clicks: t.clicks || 0,
    impressions: t.impressions || 0,
    ctr: +(100 * (t.ctr || 0)).toFixed(1),
    position: +(t.position || 0).toFixed(1),
    queries_total: rows.length,
    queries_non_branded: nonBranded.length,
    top_non_branded: nonBranded.slice(0, 10).map((r) => ({ q: r.keys[0], clicks: r.clicks, impr: r.impressions })),
  };

  if (args.includes('--log')) {
    const csv = path.join(ROOT, 'docs/company/metrics/awareness-log.csv');
    const note = `GSC API auto-pull ${days}d (${range.startDate}..${range.endDate}); ${out.queries_non_branded} non-branded of ${out.queries_total} queries; CTR ${out.ctr}%`;
    // schema: date_utc,A1,A2,A3,A4,A5,A6,A7,note  (A4=impressions A5=clicks A6=position)
    const row = `${range.endDate},n/a,n/a,n/a,${out.impressions},${out.clicks},${out.position},n/a,"${note}"\n`;
    readFileSync(csv, 'utf8'); // ensure it exists
    appendFileSync(csv, row);
    console.log(`logged -> ${path.relative(ROOT, csv)}`);
  }

  if (asJson) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`GSC ${site}  (${range.startDate} -> ${range.endDate}, ${days}d)`);
    console.log(`  clicks:      ${out.clicks}`);
    console.log(`  impressions: ${out.impressions}`);
    console.log(`  CTR:         ${out.ctr}%`);
    console.log(`  avg position:${out.position}`);
    console.log(`  queries:     ${out.queries_total} total, ${out.queries_non_branded} NON-branded`);
    if (out.top_non_branded.length) {
      console.log('  top non-branded:');
      for (const r of out.top_non_branded) console.log(`    - "${r.q}"  ${r.clicks}c / ${r.impr}i`);
    } else {
      console.log('  top non-branded: (none yet — Objective-2 gap)');
    }
  }
} catch (e) {
  console.error(`ERROR: ${e.message}`);
  if (/403|permission|forbidden/i.test(e.message)) {
    console.error('  -> The service account likely is not added as a user on the GSC property.');
    console.error('     GSC -> Settings -> Users and permissions -> Add user -> the SA email -> Restricted.');
  }
  process.exit(1);
}
