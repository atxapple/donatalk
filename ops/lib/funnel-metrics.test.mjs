import { describe, it, expect } from 'vitest';
import { computeFunnel, tsMs } from './funnel-metrics.mjs';

const DAY = 86400000;
const NOW = Date.UTC(2026, 6, 11, 12, 0, 0); // 2026-07-11T12:00Z

describe('tsMs', () => {
  it('normalizes Firestore Timestamp-like objects', () => {
    expect(tsMs({ toMillis: () => 123 })).toBe(123);
  });
  it('normalizes Date and epoch-ms', () => {
    expect(tsMs(new Date(456))).toBe(456);
    expect(tsMs(789)).toBe(789);
  });
  it('returns null for missing/invalid values', () => {
    expect(tsMs(null)).toBeNull();
    expect(tsMs(undefined)).toBeNull();
    expect(tsMs('2026-01-01')).toBeNull();
    expect(tsMs(NaN)).toBeNull();
  });
});

describe('computeFunnel', () => {
  it('returns zeros on empty data', () => {
    expect(computeFunnel({}, NOW)).toEqual({ F1: 0, F2: 0, F3: 0, F4: 0, R1: 0 });
  });

  it('F1 counts distinct uids across both profile collections in 7d', () => {
    const inWin = NOW - 2 * DAY;
    const outWin = NOW - 10 * DAY;
    const { F1 } = computeFunnel(
      {
        // signup creates BOTH docs under one uid — must not double count
        pitchers: [
          { id: 'u1', createdAtMs: inWin },
          { id: 'u2', createdAtMs: outWin },
          { id: 'u3', createdAtMs: null },
        ],
        listeners: [
          { id: 'u1', createdAtMs: inWin },
          { id: 'u4', createdAtMs: inWin },
        ],
      },
      NOW
    );
    expect(F1).toBe(2); // u1 (deduped) + u4
  });

  it('F2 counts funded pitchers regardless of age', () => {
    const { F2 } = computeFunnel(
      {
        pitchers: [
          { id: 'a', createdAtMs: NOW - 100 * DAY, creditBalance: 25 },
          { id: 'b', createdAtMs: NOW - 1 * DAY, creditBalance: 0 },
          { id: 'c', createdAtMs: NOW - 1 * DAY }, // missing balance
        ],
      },
      NOW
    );
    expect(F2).toBe(1);
  });

  it('F3 counts meetings created in 7d; F4 only accepted responded in 7d', () => {
    const { F3, F4 } = computeFunnel(
      {
        meetings: [
          { createdAtMs: NOW - 1 * DAY, status: 'reserved', pitcherId: 'a' },
          { createdAtMs: NOW - 2 * DAY, status: 'accepted', respondedAtMs: NOW - 1 * DAY, pitcherId: 'a' },
          // accepted long ago — outside the 7d commit window
          { createdAtMs: NOW - 20 * DAY, status: 'accepted', respondedAtMs: NOW - 15 * DAY, pitcherId: 'b' },
          // accepted with no respondedAt falls back to createdAt
          { createdAtMs: NOW - 3 * DAY, status: 'accepted', respondedAtMs: null, pitcherId: 'c' },
          { createdAtMs: NOW - 10 * DAY, status: 'declined', respondedAtMs: NOW - 9 * DAY, pitcherId: 'a' },
        ],
      },
      NOW
    );
    expect(F3).toBe(3);
    expect(F4).toBe(2);
  });

  it('R1 is bookings per distinct booking pitcher over 30d', () => {
    const { R1 } = computeFunnel(
      {
        meetings: [
          { createdAtMs: NOW - 1 * DAY, status: 'reserved', pitcherId: 'a' },
          { createdAtMs: NOW - 5 * DAY, status: 'declined', pitcherId: 'a' },
          { createdAtMs: NOW - 20 * DAY, status: 'accepted', pitcherId: 'b' },
          // outside 30d — excluded
          { createdAtMs: NOW - 40 * DAY, status: 'accepted', pitcherId: 'b' },
        ],
      },
      NOW
    );
    expect(R1).toBe(1.5); // 3 bookings / 2 pitchers
  });
});
