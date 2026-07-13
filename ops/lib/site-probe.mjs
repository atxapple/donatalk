// Pure logic for the donatalk synthetic site probe (ops/check-site.mjs).
// Restores the content-marker assertions the Windows probe (check-site.ps1)
// had and the Linux shared probe (ops-shared/check-site.sh) lost in the port:
// a route is healthy only if it returns 200 AND its HTML contains the marker.
// Marker match is case-insensitive, matching PowerShell's -match default.

// route -> substring that must appear in the HTML for the path to be healthy.
export const CHECKS = [
  { path: '/', marker: 'DonaTalk' },
  { path: '/listeners', marker: 'listener' },
  { path: '/login', marker: 'DonaTalk' },
];

export const DEFAULT_BASE = 'https://app.donatalk.com';
export const FETCH_TIMEOUT_MS = 30000;

// status: number|'ERR'; body: string ('' on fetch error).
export function evaluateCheck(status, body, marker) {
  const statusOk = status === 200;
  const markerOk = statusOk && String(body).toLowerCase().includes(marker.toLowerCase());
  return { statusOk, markerOk, ok: statusOk && markerOk };
}

// Same artifact shape as ops-shared/check-site.sh writes (get-metrics.mjs and
// deploy-web.mjs key off `timestamp` + `overall`); marker fields are additive.
export function buildArtifact(ts, base, results) {
  const failed = results.filter((r) => !r.ok).length;
  return {
    timestamp: ts,
    business: 'donatalk',
    host: 'linux',
    overall: failed === 0 ? 'pass' : 'fail',
    failed,
    full_probe: 'skipped', // no transactional (signup/login) probe for donatalk yet
    markers: 'checked',
    results,
  };
}

export function utcStamp(d = new Date()) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}
