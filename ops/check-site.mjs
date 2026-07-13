#!/usr/bin/env node
// Synthetic health probe for app.donatalk.com critical paths (KR1-4).
// Linux port of ops/check-site.ps1 WITH the content-marker assertions the
// shared HTTP-200-only probe lacked (backlog item 21): each route must return
// 200 AND contain its expected marker substring.
//
// Read-only: fetches public routes only. NO test users created (booking/signup
// are behind auth + PayPal - probing them live would touch money-adjacent
// flows, which the Charter fences off).
//
// Writes ops/logs/site-check-<ts>.json in the same shape as
// ops-shared/check-site.sh (which delegates to this script when present), plus
// ALERT-check-site-<ts>.txt on failure. Exit 0 = healthy, 1 = failure.
//
// Usage: node ops/check-site.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHECKS,
  DEFAULT_BASE,
  FETCH_TIMEOUT_MS,
  evaluateCheck,
  buildArtifact,
  utcStamp,
} from './lib/site-probe.mjs';

const OPS_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(OPS_DIR, 'logs');
const BASE = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE;

mkdirSync(LOG_DIR, { recursive: true });
const ts = utcStamp();

const results = [];
for (const c of CHECKS) {
  const url = `${BASE}${c.path}`;
  let status = 'ERR';
  let body = '';
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    status = res.status;
    body = await res.text();
  } catch (e) {
    console.log(`  ${url} -> ERROR ${String(e.message || e).slice(0, 80)}`);
  }
  const { ok, markerOk } = evaluateCheck(status, body, c.marker);
  results.push({ url, status, ok, marker: c.marker, marker_ok: markerOk });
  console.log(`  ${url} -> ${status}${ok ? ' ok' : ` FAIL${status === 200 && !markerOk ? ` (marker "${c.marker}" missing)` : ''}`}`);
}

const artifact = buildArtifact(ts, BASE, results);
const artifactPath = path.join(LOG_DIR, `site-check-${ts}.json`);
writeFileSync(artifactPath, JSON.stringify(artifact) + '\n');

if (artifact.failed > 0) {
  const alertPath = path.join(LOG_DIR, `ALERT-check-site-${ts}.txt`);
  writeFileSync(
    alertPath,
    `Site probe FAILED at ${ts} against ${BASE} (${artifact.failed} of ${results.length} checks)\n` +
      JSON.stringify(artifact, null, 2) + '\n'
  );
  console.log(`PROBE FAILED - wrote ${alertPath}`);
  process.exit(1);
}
console.log(`PROBE OK - ${BASE} all critical paths healthy (200 + markers).`);
process.exit(0);
