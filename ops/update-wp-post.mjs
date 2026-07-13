// ops/update-wp-post.mjs
//
// Update an EXISTING WordPress post on donatalk.com from a content draft
// (docs/company/content/*.md), matching by slug. Companion to publish-wp.mjs
// (which only creates posts). Built 2026-07-13 to remediate the leaked
// editorial-note blocks that published with the 07-11 posts.
//
// SAFETY (Charter Sec 3a/Sec 6):
//   - Credentials are read ONLY from env (WORDPRESS_API_URL / WORDPRESS_APP_USER /
//     WORDPRESS_APP_PASSWORD). Never hardcode or print the password.
//   - Default is DRY-RUN (shows the resolved post + new content size, writes
//     nothing). A live update requires the explicit --apply flag.
//   - Only `content` (and excerpt, if set in frontmatter) is updated; title,
//     slug, and status are left untouched on the live post.
//
// Usage:
//   node ops/update-wp-post.mjs docs/company/content/<draft>.md            # dry-run
//   node ops/update-wp-post.mjs docs/company/content/<draft>.md --apply    # write
//
// Exit codes: 0 ok · 2 usage · 3 WP REST error · 4 post not found by slug

import { readFileSync } from 'node:fs';
import { draftToWp } from './lib/md-to-wp.mjs';

function fail(msg, code = 1) {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const apply = args.includes('--apply');

if (!file) fail('Usage: node ops/update-wp-post.mjs <draft.md> [--apply]', 2);

const apiUrl = process.env.WORDPRESS_API_URL;
const user = process.env.WORDPRESS_APP_USER;
const pass = process.env.WORDPRESS_APP_PASSWORD;
if (!apiUrl) fail('WORDPRESS_API_URL not set', 2);
if (apply && !(user && pass)) fail('WORDPRESS_APP_USER/APP_PASSWORD required for --apply', 2);

const raw = readFileSync(file, 'utf8');
const { meta, payload } = draftToWp(raw, { publish: true });
const slug = meta.slug || payload.slug;
if (!slug) fail('draft frontmatter has no slug — cannot match the live post', 2);

function resolveBase(base) {
  const b = base.replace(/\/+$/, '');
  if (/\/wp\/v2($|\/)/.test(b)) return b.replace(/\/wp\/v2.*$/, '/wp/v2');
  if (/\/wp-json$/.test(b)) return `${b}/wp/v2`;
  return `${b}/wp-json/wp/v2`;
}
const base = resolveBase(apiUrl);

// Published posts are readable without auth; auth is only needed to write.
const lookup = await fetch(`${base}/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,link,status`);
if (!lookup.ok) fail(`WP REST ${lookup.status} on slug lookup`, 3);
const matches = await lookup.json();
if (!Array.isArray(matches) || matches.length === 0) fail(`no live post with slug '${slug}'`, 4);
if (matches.length > 1) fail(`slug '${slug}' matched ${matches.length} posts — refusing`, 4);
const post = matches[0];

const update = { content: payload.content };
if (payload.excerpt) update.excerpt = payload.excerpt;

console.log(`draft:   ${file}`);
console.log(`post:    id=${post.id} status=${post.status} ${post.link}`);
console.log(`content: ${payload.content.length} chars of HTML (title/slug/status untouched)`);

if (!apply) {
  console.log('\ndry-run: no write made. Re-run with --apply to update the live post.');
  process.exit(0);
}

const auth = Buffer.from(`${user}:${pass}`).toString('base64');
const res = await fetch(`${base}/posts/${post.id}`, {
  method: 'POST',
  headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(update),
});
if (!res.ok) {
  const text = await res.text().catch(() => '');
  fail(`WP REST ${res.status} ${res.statusText} - ${text.slice(0, 300)}`, 3);
}
const updated = await res.json();
console.log(`\nOK: post ${updated.id} updated ('${updated.status}') -> ${updated.link || '(no link)'}`);
