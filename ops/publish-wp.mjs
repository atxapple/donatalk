// ops/publish-wp.mjs
//
// Publish a DonaTalk content draft (docs/company/content/*.md) to WordPress
// (donatalk.com) via the REST API, reading credentials from the environment.
//
// SAFETY (Charter Sec 3a/Sec 6):
//   - Credentials are read ONLY from env (WORDPRESS_API_URL / WORDPRESS_APP_USER /
//     WORDPRESS_APP_PASSWORD). Never hardcode or print the password.
//   - Default status is DRAFT. Publishing live requires the explicit --publish flag.
//   - --dry-run (or missing creds) prints what WOULD be sent and makes no network call.
//
// This pipeline is built but NOT yet run live: the board must rotate the WP App
// Password (it transited chat) before any real write. Until then, use --dry-run.
//
// Usage:
//   node ops/publish-wp.mjs docs/company/content/<draft>.md            # draft (needs creds)
//   node ops/publish-wp.mjs docs/company/content/<draft>.md --dry-run  # offline preview
//   node ops/publish-wp.mjs docs/company/content/<draft>.md --publish  # go live (guarded)

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { draftToWp } from './lib/md-to-wp.mjs';

function fail(msg, code = 1) {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
}

// Load KEY=VALUE pairs from the repo-root .env.local into process.env (without
// overriding anything already set). Keeps secrets in the gitignored file - the
// runner/host env still wins if it provides them. No dotenv dependency.
function loadEnvLocal() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const file = path.join(root, '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trimStart().startsWith('#')) continue;
    const key = m[1];
    if (process.env[key] !== undefined) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadEnvLocal();

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const publish = args.includes('--publish');
let dryRun = args.includes('--dry-run');

if (!file) fail('Usage: node ops/publish-wp.mjs <draft.md> [--dry-run] [--publish]', 2);

const apiUrl = process.env.WORDPRESS_API_URL;
const user = process.env.WORDPRESS_APP_USER;
const pass = process.env.WORDPRESS_APP_PASSWORD;
const haveCreds = Boolean(apiUrl && user && pass);

if (!haveCreds && !dryRun) {
  console.error('WARN: WORDPRESS_API_URL/APP_USER/APP_PASSWORD not all set - forcing --dry-run.');
  dryRun = true;
}

const raw = readFileSync(file, 'utf8');
const { meta, payload } = draftToWp(raw, { publish });

// Resolve the REST endpoint from a bare site URL or an explicit wp-json base.
function resolveEndpoint(base) {
  const b = base.replace(/\/+$/, '');
  if (/\/wp\/v2($|\/)/.test(b)) return b.replace(/\/wp\/v2.*$/, '/wp/v2/posts');
  if (/\/wp-json$/.test(b)) return `${b}/wp/v2/posts`;
  return `${b}/wp-json/wp/v2/posts`;
}
const endpoint = apiUrl ? resolveEndpoint(apiUrl) : '(unset WORDPRESS_API_URL)';

console.log(`draft:    ${file}`);
console.log(`title:    ${payload.title}`);
console.log(`slug:     ${payload.slug || '(auto)'}`);
console.log(`status:   ${payload.status}${publish ? '' : '  (use --publish to go live)'}`);
console.log(`endpoint: ${endpoint}`);
console.log(`content:  ${payload.content.length} chars of HTML`);

if (dryRun) {
  console.log('\n--dry-run: no network call made. HTML preview (first 600 chars):\n');
  console.log(payload.content.slice(0, 600));
  process.exit(0);
}

const auth = Buffer.from(`${user}:${pass}`).toString('base64');
const res = await fetch(endpoint, {
  method: 'POST',
  headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const text = await res.text().catch(() => '');
  fail(`WP REST ${res.status} ${res.statusText} - ${text.slice(0, 300)}`, 3);
}

const created = await res.json();
console.log(`\nOK: post ${created.id} created as '${created.status}' -> ${created.link || '(no link)'}`);
