// ops/lib/funnel-metrics.mjs
//
// Pure computation for the funnel metrics (METRICS.md section B/C) from
// already-fetched Firestore document data. Kept free of I/O so it is unit
// testable; ops/get-metrics.mjs owns fetching and CSV writing.
//
// Metric definitions (pinned here so every row means the same thing):
//   F1  signups (7d)            = distinct uids with a profile doc (pitchers or
//                                 listeners) created in the window — signup
//                                 creates both docs under one uid, so distinct
//                                 uid count = signups.
//   F2  activated pitchers      = pitchers with credit_balance > 0 (all-time).
//   F3  meetings booked (7d)    = meetings created in the window (all meetings
//                                 start as reserved/pending — demand signal).
//   F4  donations committed (7d)= meetings with status 'accepted' whose
//                                 respondedAt (fallback createdAt) is in the
//                                 window.
//   R1  repeat bookings (30d)   = meetings created in 30d / distinct pitchers
//                                 booking in 30d, 2dp; 0 when no bookings.

const DAY_MS = 86400000;

// Normalize Firestore Timestamp / Date / epoch-ms to epoch-ms (or null).
export function tsMs(v) {
  if (v == null) return null;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

export function computeFunnel({ pitchers = [], listeners = [], meetings = [] }, nowMs) {
  const d7 = nowMs - 7 * DAY_MS;
  const d30 = nowMs - 30 * DAY_MS;

  const signupUids = new Set();
  for (const p of pitchers) {
    if (p.createdAtMs != null && p.createdAtMs >= d7) signupUids.add(p.id);
  }
  for (const l of listeners) {
    if (l.createdAtMs != null && l.createdAtMs >= d7) signupUids.add(l.id);
  }
  const F1 = signupUids.size;

  const F2 = pitchers.filter((p) => (p.creditBalance || 0) > 0).length;

  const F3 = meetings.filter((m) => m.createdAtMs != null && m.createdAtMs >= d7).length;

  const F4 = meetings.filter((m) => {
    if (m.status !== 'accepted') return false;
    const t = m.respondedAtMs ?? m.createdAtMs;
    return t != null && t >= d7;
  }).length;

  const recent = meetings.filter((m) => m.createdAtMs != null && m.createdAtMs >= d30);
  const bookers = new Set(recent.map((m) => m.pitcherId).filter(Boolean));
  const R1 = bookers.size === 0 ? 0 : +(recent.length / bookers.size).toFixed(2);

  return { F1, F2, F3, F4, R1 };
}
