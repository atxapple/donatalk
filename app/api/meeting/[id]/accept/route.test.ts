import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRunTransaction, mockVerifyToken, mockSendAcceptEmail } = vi.hoisted(() => ({
  mockRunTransaction: vi.fn(),
  mockVerifyToken: vi.fn(),
  mockSendAcceptEmail: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    collection: () => ({ doc: () => ({ id: 'meeting-1' }) }),
    runTransaction: mockRunTransaction,
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: (n: number) => ({ _type: 'increment', n }),
  },
  Timestamp: {
    now: () => ({ _type: 'timestamp-now' }),
  },
}));

vi.mock('@/lib/meetingTokens', () => ({
  verifyToken: mockVerifyToken,
}));

vi.mock('@/lib/meetingEmails', () => ({
  sendAcceptConfirmationEmail: mockSendAcceptEmail,
}));

import { GET } from './route';

function makeReq(token?: string): Request {
  const url = token
    ? `http://localhost:3000/api/meeting/meeting-1/accept?token=${token}`
    : `http://localhost:3000/api/meeting/meeting-1/accept`;
  return new Request(url, { method: 'GET' });
}

const ctx = { params: Promise.resolve({ id: 'meeting-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendAcceptEmail.mockResolvedValue(undefined);
});

describe('GET /api/meeting/[id]/accept', () => {
  it('400 when token missing', async () => {
    const res = await GET(makeReq(), ctx);
    expect(res.status).toBe(400);
  });

  it('404 when meeting does not exist', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'not-found' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(404);
  });

  it('403 when token verification fails', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'invalid-token' }));
    const res = await GET(makeReq('bad'), ctx);
    expect(res.status).toBe(403);
  });

  it('shows already-used message for second click', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'token-used' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Already Used');
  });

  it('shows terminal-state page when already accepted', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'terminal-state', status: 'accepted' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Already accepted');
  });

  it('shows expired page when reservation TTL exceeded', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'expired' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('expired');
  });

  it('shows pitcher-gone page when pitcher soft-deleted', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'pitcher-gone' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('no longer active');
  });

  it('shows 409 when pitcher balance no longer sufficient (pending flow)', async () => {
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'insufficient-balance',
      available: 10,
      required: 50,
    }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(409);
    const html = await res.text();
    expect(html).toContain('no longer sufficient');
    expect(html).toContain('50.00');
  });

  it('happy path: confirms meeting and sends emails to both parties', async () => {
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'accepted',
      amount: 100,
      pitcherName: 'Pia',
      pitcherEmail: 'p@x.com',
      listenerName: 'Lara',
      listenerEmail: 'l@x.com',
    }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Meeting confirmed');
    expect(html).toContain('100.00');
    expect(mockSendAcceptEmail).toHaveBeenCalledTimes(2);
  });

  it('still succeeds when confirmation emails fail', async () => {
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'accepted',
      amount: 50,
      pitcherName: 'P',
      pitcherEmail: 'p@x.com',
      listenerName: 'L',
      listenerEmail: 'l@x.com',
    }));
    mockSendAcceptEmail.mockRejectedValue(new Error('SMTP down'));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
  });

  it('500 on unexpected error', async () => {
    mockRunTransaction.mockRejectedValue(new Error('firestore unreachable'));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(500);
  });

  it('terminal-state copy varies by status (declined)', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'terminal-state', status: 'declined' }));
    const res = await GET(makeReq('t'), ctx);
    const html = await res.text();
    expect(html).toContain('Already declined');
  });

  it('terminal-state copy varies by status (cancelled)', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'terminal-state', status: 'cancelled' }));
    const res = await GET(makeReq('t'), ctx);
    const html = await res.text();
    expect(html).toContain('Already cancelled');
  });
});

// Transaction-body tests: execute the actual cb so we cover the in-tx logic.
describe('GET /api/meeting/[id]/accept — transaction body', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue(true);
    mockSendAcceptEmail.mockResolvedValue(undefined);
  });

  const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recent = { toMillis: () => now - 1000 };
  const expired = { toMillis: () => now - FOURTEEN_DAYS - 1000 };

  function makeTx(meeting: Record<string, unknown>, pitcher?: Record<string, unknown>, pitcherExists = true) {
    const tx = { get: vi.fn(), set: vi.fn(), update: vi.fn() };
    tx.get
      .mockResolvedValueOnce({ exists: true, data: () => meeting })
      .mockResolvedValueOnce({ exists: pitcherExists, data: () => pitcher ?? {} });
    return tx;
  }

  it('reserved→accepted: commits balance and writes fund_history', async () => {
    let capturedTx: ReturnType<typeof makeTx> | undefined;
    mockRunTransaction.mockImplementation(async (cb) => {
      capturedTx = makeTx(
        { status: 'reserved', tokenUsed: false, acceptTokenHash: 'h', reservedAt: recent, reservedAmount: 100, pitcherId: 'P', listenerId: 'L', pitcherName: 'P', pitcherEmail: 'p@x.com', listenerName: 'L', listenerEmail: 'l@x.com' },
        { credit_balance: 200, reservedBalance: 100 },
      );
      return cb(capturedTx);
    });
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const updates = capturedTx!.update.mock.calls;
    const sets = capturedTx!.set.mock.calls;
    // First update is on pitcher (decrement balance + reserved + count)
    const pitcherUpdate = updates[0][1];
    expect(pitcherUpdate.credit_balance).toMatchObject({ _type: 'increment', n: -100 });
    expect(pitcherUpdate.reservedBalance).toMatchObject({ _type: 'increment', n: -100 });
    expect(pitcherUpdate.pendingReservationCount).toMatchObject({ _type: 'increment', n: -1 });
    // Meeting update marks accepted
    const meetingUpdate = updates[1][1];
    expect(meetingUpdate.status).toBe('accepted');
    expect(meetingUpdate.tokenUsed).toBe(true);
    // fund_history entry written
    expect(sets).toHaveLength(1);
    expect(sets[0][1]).toMatchObject({ amount: 100, eventType: 'meeting_commit', pitcherId: 'P', listenerId: 'L' });
  });

  it('pending→accepted: deducts credit_balance only (no reservedBalance change)', async () => {
    let capturedTx: ReturnType<typeof makeTx> | undefined;
    mockRunTransaction.mockImplementation(async (cb) => {
      capturedTx = makeTx(
        { status: 'pending', tokenUsed: false, acceptTokenHash: 'h', reservedAt: recent, reservedAmount: 100, pitcherId: 'P', listenerId: 'L', pitcherName: 'P', pitcherEmail: 'p@x.com', listenerName: 'L', listenerEmail: 'l@x.com' },
        { credit_balance: 200, reservedBalance: 50 },
      );
      return cb(capturedTx);
    });
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const pitcherUpdate = capturedTx!.update.mock.calls[0][1];
    expect(pitcherUpdate.credit_balance).toMatchObject({ _type: 'increment', n: -100 });
    expect(pitcherUpdate.reservedBalance).toBeUndefined();
    expect(pitcherUpdate.pendingReservationCount).toBeUndefined();
  });

  it('pending→accept fails 409 when available balance dropped below required', async () => {
    mockRunTransaction.mockImplementation(async (cb) => {
      const tx = makeTx(
        { status: 'pending', tokenUsed: false, acceptTokenHash: 'h', reservedAt: recent, reservedAmount: 100, pitcherId: 'P' },
        { credit_balance: 80, reservedBalance: 30 },
      );
      return cb(tx);
    });
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(409);
    const html = await res.text();
    expect(html).toContain('50.00'); // available = 80 - 30
    expect(html).toContain('100.00'); // required
  });

  it('expired reservation: flips status, releases reservation, returns 200', async () => {
    let capturedTx: ReturnType<typeof makeTx> | undefined;
    mockRunTransaction.mockImplementation(async (cb) => {
      capturedTx = makeTx(
        { status: 'reserved', tokenUsed: false, acceptTokenHash: 'h', reservedAt: expired, reservedAmount: 75, pitcherId: 'P' },
      );
      return cb(capturedTx);
    });
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('expired');
    const pitcherUpdate = capturedTx!.update.mock.calls[0][1];
    expect(pitcherUpdate.reservedBalance).toMatchObject({ _type: 'increment', n: -75 });
    expect(pitcherUpdate.pendingReservationCount).toMatchObject({ _type: 'increment', n: -1 });
    const meetingUpdate = capturedTx!.update.mock.calls[1][1];
    expect(meetingUpdate.status).toBe('expired');
    expect(meetingUpdate.tokenUsed).toBe(true);
  });

  it('expired pending: flips status without touching reservedBalance', async () => {
    let capturedTx: ReturnType<typeof makeTx> | undefined;
    mockRunTransaction.mockImplementation(async (cb) => {
      capturedTx = makeTx(
        { status: 'pending', tokenUsed: false, acceptTokenHash: 'h', reservedAt: expired, reservedAmount: 75, pitcherId: 'P' },
      );
      return cb(capturedTx);
    });
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    // Only one update — the meeting itself; no pitcher update because nothing was reserved
    expect(capturedTx!.update.mock.calls).toHaveLength(1);
    expect(capturedTx!.update.mock.calls[0][1].status).toBe('expired');
  });

  it('pitcher soft-deleted mid-flight: releases reservation and cancels meeting', async () => {
    let capturedTx: ReturnType<typeof makeTx> | undefined;
    mockRunTransaction.mockImplementation(async (cb) => {
      capturedTx = makeTx(
        { status: 'reserved', tokenUsed: false, acceptTokenHash: 'h', reservedAt: recent, reservedAmount: 60, pitcherId: 'P' },
        { credit_balance: 100, deletedAt: { _seconds: 123 } },
      );
      return cb(capturedTx);
    });
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('no longer active');
    const pitcherUpdate = capturedTx!.update.mock.calls[0][1];
    expect(pitcherUpdate.reservedBalance).toMatchObject({ _type: 'increment', n: -60 });
    const meetingUpdate = capturedTx!.update.mock.calls[1][1];
    expect(meetingUpdate.status).toBe('cancelled');
    expect(meetingUpdate.cancelReason).toBe('pitcher-deleted');
  });

  it('rejects with invalid-token when hash does not match', async () => {
    mockVerifyToken.mockReturnValueOnce(false);
    mockRunTransaction.mockImplementation(async (cb) => {
      const tx = makeTx({ status: 'reserved', tokenUsed: false, acceptTokenHash: 'real-hash', reservedAt: recent, reservedAmount: 10, pitcherId: 'P' });
      return cb(tx);
    });
    const res = await GET(makeReq('tampered'), ctx);
    expect(res.status).toBe(403);
  });

  it('skips already-tokenUsed even when status would otherwise allow accept', async () => {
    mockRunTransaction.mockImplementation(async (cb) => {
      const tx = makeTx({ status: 'reserved', tokenUsed: true, acceptTokenHash: 'h', reservedAt: recent, reservedAmount: 10, pitcherId: 'P' });
      return cb(tx);
    });
    const res = await GET(makeReq('t'), ctx);
    const html = await res.text();
    expect(html).toContain('Already Used');
  });

  it('terminal-state takes precedence over token-used check', async () => {
    mockRunTransaction.mockImplementation(async (cb) => {
      const tx = makeTx({ status: 'accepted', tokenUsed: true, acceptTokenHash: 'h', reservedAt: recent });
      return cb(tx);
    });
    const res = await GET(makeReq('t'), ctx);
    const html = await res.text();
    expect(html).toContain('Already accepted');
  });
});
