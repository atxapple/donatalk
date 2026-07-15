// ops/gsc-inspect.mjs
//
// Inspect URL index status via the Google Search Console URL Inspection API
// using the same read-only service-account key as gsc-pull.mjs. No external
// dependencies — signs the OAuth JWT with node's crypto and calls the API
// with fetch. Replaces the manual ops-browser "URL Inspection" step for
// indexation checks (quota: 2000 inspections/day per property — generous).
//
// Setup: service-account JSON key path in .env.local as GSC_SA_KEY_FILE, and
// the service account added as a user on the GSC property (Restricted works).
//
// Usage:
//   node ops/gsc-inspect.mjs                          # default content-URL set
//   node ops/gsc-inspect.mjs https://donatalk.com/    # explicit URL(s)
//   node ops/gsc-inspect.mjs --json                   # machine-readable output
//   node ops/gsc-inspect.mjs --log                    # also write ops/logs/GSC-INSPECT-<ts>.txt

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
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
const doLog = args.includes('--log');
const site = args.find((a) => a.startsWith('sc-domain:')) || 'sc-domain:donatalk.com';

// The tracked content surfaces (backlog #29/#34 + /for-listeners from #30).
const DEFAULT_URLS = [
  'https://donatalk.com/',
  'https://donatalk.com/cold-email-alternatives/',
  'https://donatalk.com/how-to-get-warm-introductions/',
  'https://donatalk.com/what-is-donation-based-outreach/',
  'https://donatalk.com/book-meetings-without-cold-email/',
  'https://app.donatalk.com/for-listeners',
];
const urls = args.filter((a) => a.startsWith('http'));
const targets = urls.length ? urls : DEFAULT_URLS;

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

async function inspect(token, inspectionUrl) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl: site }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`inspect ${res.status} for ${inspectionUrl}: ${JSON.stringify(j).slice(0, 400)}`);
  const r = j.inspectionResult?.indexStatusResult || {};
  return {
    url: inspectionUrl,
    verdict: r.verdict || 'UNKNOWN',            // PASS = indexed
    coverageState: r.coverageState || 'n/a',    // human-readable, e.g. "Submitted and indexed"
    indexingState: r.indexingState || 'n/a',
    pageFetchState: r.pageFetchState || 'n/a',
    robotsTxtState: r.robotsTxtState || 'n/a',
    lastCrawlTime: r.lastCrawlTime || 'never',
    googleCanonical: r.googleCanonical || 'n/a',
    userCanonical: r.userCanonical || 'n/a',
    sitemaps: r.sitemap || [],
  };
}

const keyPath = path.resolve(ROOT, process.env.GSC_SA_KEY_FILE || 'gsc-sa.json');
if (!existsSync(keyPath)) {
  console.error(`ERROR: key file not found: ${keyPath} (set GSC_SA_KEY_FILE in .env.local)`);
  process.exit(2);
}

try {
  const token = await getAccessToken(keyPath);
  const results = [];
  for (const u of targets) {
    results.push(await inspect(token, u));
  }
  const indexed = results.filter((r) => r.verdict === 'PASS').length;
  const out = { site, indexed, total: results.length, results };

  if (asJson) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`GSC URL Inspection  ${site}  — ${indexed}/${results.length} indexed`);
    for (const r of results) {
      console.log(`  [${r.verdict === 'PASS' ? 'INDEXED' : r.verdict}] ${r.url}`);
      console.log(`      coverage: ${r.coverageState} | crawled: ${r.lastCrawlTime} | fetch: ${r.pageFetchState}`);
      if (r.googleCanonical !== 'n/a' && r.googleCanonical !== r.url) {
        console.log(`      google canonical: ${r.googleCanonical}`);
      }
    }
  }

  if (doLog) {
    const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const f = path.join(ROOT, 'ops/logs', `GSC-INSPECT-${ts}.txt`);
    writeFileSync(f, JSON.stringify(out, null, 2) + '\n');
    console.log(`logged -> ${path.relative(ROOT, f)}`);
  }
} catch (e) {
  console.error(`ERROR: ${e.message}`);
  if (/403|permission|forbidden/i.test(e.message)) {
    console.error('  -> The service account may lack permission for the URL Inspection API on this property.');
    console.error('     Fallback: the ops-browser path (GSC UI URL Inspection) still works.');
  }
  process.exit(1);
}
