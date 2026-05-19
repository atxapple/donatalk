import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockRunTransaction, mockMeetingsWhere, mockDocFn, mockNewDocRef, mockSendReservationEmail } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockMeetingsWhere: vi.fn(),
  mockDocFn: vi.fn(),
  mockNewDocRef: { id: 'new-meeting-id' },
  mockSendReservationEmail: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
  adminDb: {
    collection: (name: string) => {
      if (name === 'meetings') {
        return {
          where: mockMeetingsWhere,
          doc: () => mockNewDocRef,
        };
      }
      // pitchers / listeners
      return { doc: mockDocFn };
    },
    runTransaction: mockRunTransaction,
  },
}));

vi.mock('@/lib/meetingTokens', () => ({
  generateToken: () => ({ raw: 'raw-token', hash: 'hashed-token' }),
}));

vi.mock('@/lib/meetingEmails', () => ({
  sendReservationEmailToListener: mockSendReservationEmail,
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: (n: number) => ({ _type: 'increment', n }),
    serverTimestamp: () => ({ _type: 'serverTimestamp' }),
    delete: () => ({ _type: 'deleteField' }),
  },
  Timestamp: {
    now: () => ({ _type: 'timestamp-now' }),
  },
}));

import { POST } from './route';

function makeRequest(body: unknown, token?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/book-meeting-from-balance', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function emptyMeetingsSnap() {
  return { empty: true, docs: [] as Array<{ id: string; data: () => Record<string, unknown> }> };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSendReservationEmail.mockResolvedValue(undefined);
});

describe('POST /api/book-meeting-from-balance', () => {
  describe('auth', () => {
    it('returns 401 when no auth header', async () => {
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x', idempotencyKey: 'k' }));
      expect(res.status).toBe(401);
    });

    it('returns 401 when token verification fails', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('bad'));
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(401);
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
    });

    it('returns 400 when listenerId missing', async () => {
      const res = await POST(makeRequest({ availability: 'x', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(400);
    });

    it('returns 400 when availability missing', async () => {
      const res = await POST(makeRequest({ listenerId: 'L', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(400);
    });

    it('returns 400 when idempotencyKey missing', async () => {
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x' }, 't'));
      expect(res.status).toBe(400);
    });

    it('returns 400 when pitcher tries to book themselves', async () => {
      const res = await POST(makeRequest({ listenerId: 'P', availability: 'x', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/yourself/i);
    });

    it('returns 400 on malformed JSON', async () => {
      const req = new Request('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t' },
        body: 'not json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('idempotency', () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
    });

    it('returns existing meeting when idempotencyKey matches', async () => {
      mockMeetingsWhere.mockReturnValue({
        limit: () => ({
          get: () => Promise.resolve({
            empty: false,
            docs: [{ id: 'existing-meeting', data: () => ({ status: 'reserved', reservedAmount: 104.9 }) }],
          }),
        }),
      });

      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x', idempotencyKey: 'k' }, 't'));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.meetingId).toBe('existing-meeting');
      expect(body.idempotentReplay).toBe(true);
      expect(mockRunTransaction).not.toHaveBeenCalled();
    });
  });

  describe('transaction errors', () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
      mockMeetingsWhere.mockReturnValue({ limit: () => ({ get: () => Promise.resolve(emptyMeetingsSnap()) }) });
    });

    it('returns 403 when pitcher doc missing', async () => {
      mockRunTransaction.mockImplementation(async () => ({ error: { status: 403, message: 'Pitcher profile not found' } }));
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(403);
    });

    it('returns 404 when listener missing', async () => {
      mockRunTransaction.mockImplementation(async () => ({ error: { status: 404, message: 'Listener not found' } }));
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(404);
    });

    it('returns 429 when pitcher already has 5 pending', async () => {
      mockRunTransaction.mockImplementation(async () => ({
        error: { status: 429, message: 'too many pending' },
      }));
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(429);
    });

    it('returns 409 with available + required when insufficient balance', async () => {
      mockRunTransaction.mockImplementation(async () => ({
        error: { status: 409, code: 'insufficient-balance', message: 'low', available: 10, required: 50 },
      }));
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'x', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe('insufficient-balance');
      expect(body.available).toBe(10);
      expect(body.required).toBe(50);
    });
  });

  describe('happy path', () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
      mockMeetingsWhere.mockReturnValue({ limit: () => ({ get: () => Promise.resolve(emptyMeetingsSnap()) }) });
    });

    it('returns 200 with meeting info and triggers email with all fields', async () => {
      mockRunTransaction.mockImplementation(async () => ({
        ok: {
          meetingId: 'new-meeting-id',
          rawToken: 'raw-token',
          reservedAmount: 104.9,
          pitcherName: 'Pia Pitcher',
          listenerName: 'Lara Listener',
          listenerEmail: 'lara@x.com',
          donationAmount: 100,
          availability: 'Mon 2pm',
        },
      }));

      const res = await POST(makeRequest(
        { listenerId: 'L', availability: 'Mon 2pm', idempotencyKey: 'k' },
        't',
      ));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.meetingId).toBe('new-meeting-id');
      expect(body.status).toBe('reserved');
      expect(body.reservedAmount).toBe(104.9);
      expect(mockSendReservationEmail).toHaveBeenCalledOnce();
      expect(mockSendReservationEmail.mock.calls[0][0]).toMatchObject({
        meetingId: 'new-meeting-id',
        rawToken: 'raw-token',
        pitcherName: 'Pia Pitcher',
        listenerName: 'Lara Listener',
        listenerEmail: 'lara@x.com',
        amount: 104.9,
        donationAmount: 100,
        availability: 'Mon 2pm',
      });
    });

    it('returns 200 even when email send fails', async () => {
      mockRunTransaction.mockImplementation(async () => ({
        ok: {
          meetingId: 'new-meeting-id',
          rawToken: 'raw-token',
          reservedAmount: 50,
          pitcherName: 'P',
          listenerName: 'L',
          listenerEmail: 'l@x.com',
          donationAmount: 47,
          availability: 'a',
        },
      }));
      mockSendReservationEmail.mockRejectedValueOnce(new Error('SMTP down'));

      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(200);
    });
  });

  // These tests exercise the actual transaction body — verifying that the route's
  // mutating logic (set + update calls) is correct, not just its top-level branching.
  describe('transaction body', () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
      mockMeetingsWhere.mockReturnValue({ limit: () => ({ get: () => Promise.resolve(emptyMeetingsSnap()) }) });
    });

    function makeTxMock(opts: {
      pitcher?: Record<string, unknown>;
      listener?: Record<string, unknown>;
      pitcherExists?: boolean;
      listenerExists?: boolean;
    }) {
      const tx = {
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
      };
      tx.get
        .mockResolvedValueOnce({ exists: opts.pitcherExists ?? true, data: () => opts.pitcher ?? {} })
        .mockResolvedValueOnce({ exists: opts.listenerExists ?? true, data: () => opts.listener ?? {} });
      return tx;
    }

    it('writes a meeting doc with reserved status and increments pitcher counters', async () => {
      let capturedTx: ReturnType<typeof makeTxMock> | undefined;
      mockRunTransaction.mockImplementation(async (cb) => {
        capturedTx = makeTxMock({
          pitcher: { fullName: 'P', email: 'p@x.com', credit_balance: 200, reservedBalance: 0, pendingReservationCount: 0, isSetUp: true },
          listener: { fullName: 'L', email: 'l@x.com', donation: 100, isSetUp: true },
        });
        return cb(capturedTx);
      });

      const res = await POST(makeRequest({ listenerId: 'L', availability: 'avail', idempotencyKey: 'k1' }, 't'));
      expect(res.status).toBe(200);
      const setCalls = capturedTx!.set.mock.calls;
      const updateCalls = capturedTx!.update.mock.calls;
      expect(setCalls).toHaveLength(1);
      const meetingDoc = setCalls[0][1];
      expect(meetingDoc).toMatchObject({
        meetingsource: 'listenerPage',
        pitcherId: 'P',
        listenerId: 'L',
        status: 'reserved',
        paymentSource: 'pitcher-balance',
        reservedAmount: 104.9, // 100 * 1.049
        availability: 'avail',
        idempotencyKey: 'k1',
        tokenUsed: false,
        acceptTokenHash: 'hashed-token',
      });
      expect(updateCalls).toHaveLength(1);
      const pitcherUpdate = updateCalls[0][1];
      expect(pitcherUpdate.reservedBalance).toMatchObject({ _type: 'increment', n: 104.9 });
      expect(pitcherUpdate.pendingReservationCount).toMatchObject({ _type: 'increment', n: 1 });
    });

    it('rejects with 403 when pitcher doc missing', async () => {
      mockRunTransaction.mockImplementation(async (cb) => {
        const tx = makeTxMock({ pitcherExists: false });
        return cb(tx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(403);
    });

    it('rejects with 403 when pitcher is soft-deleted', async () => {
      mockRunTransaction.mockImplementation(async (cb) => {
        const tx = makeTxMock({
          pitcher: { deletedAt: { _seconds: 123 }, credit_balance: 200, isSetUp: true },
          listener: { donation: 100, isSetUp: true },
        });
        return cb(tx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/no longer active/i);
    });

    it('rejects with 403 when pitcher is not set up', async () => {
      mockRunTransaction.mockImplementation(async (cb) => {
        const tx = makeTxMock({
          pitcher: { isSetUp: false, credit_balance: 200 },
          listener: { donation: 100, isSetUp: true },
        });
        return cb(tx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/not set up/i);
    });

    it('rejects with 404 when listener is soft-deleted', async () => {
      mockRunTransaction.mockImplementation(async (cb) => {
        const tx = makeTxMock({
          pitcher: { credit_balance: 200, isSetUp: true },
          listener: { deletedAt: { _seconds: 123 }, donation: 100, isSetUp: true },
        });
        return cb(tx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(404);
    });

    it('rejects with 404 when listener is not set up', async () => {
      mockRunTransaction.mockImplementation(async (cb) => {
        const tx = makeTxMock({
          pitcher: { credit_balance: 200, isSetUp: true },
          listener: { donation: 100, isSetUp: false },
        });
        return cb(tx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(404);
    });

    it('rejects with 429 when pendingReservationCount reaches the cap', async () => {
      mockRunTransaction.mockImplementation(async (cb) => {
        const tx = makeTxMock({
          pitcher: { credit_balance: 1000, reservedBalance: 0, pendingReservationCount: 5, isSetUp: true },
          listener: { donation: 100, isSetUp: true },
        });
        return cb(tx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(429);
    });

    it('rejects with 409 + available + required when balance insufficient', async () => {
      mockRunTransaction.mockImplementation(async (cb) => {
        const tx = makeTxMock({
          pitcher: { credit_balance: 50, reservedBalance: 20, pendingReservationCount: 1, isSetUp: true },
          listener: { donation: 100, isSetUp: true },
        });
        return cb(tx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.code).toBe('insufficient-balance');
      expect(body.available).toBe(30); // 50 - 20
      expect(body.required).toBe(104.9); // 100 * 1.049
    });

    it('treats missing reservedBalance/pendingReservationCount as 0', async () => {
      let capturedTx: ReturnType<typeof makeTxMock> | undefined;
      mockRunTransaction.mockImplementation(async (cb) => {
        capturedTx = makeTxMock({
          pitcher: { credit_balance: 200, isSetUp: true }, // no reservedBalance, no pendingReservationCount
          listener: { donation: 100, isSetUp: true },
        });
        return cb(capturedTx);
      });
      const res = await POST(makeRequest({ listenerId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
      expect(res.status).toBe(200);
      const pitcherUpdate = capturedTx!.update.mock.calls[0][1];
      // Available should have been treated as 200 - 0 = 200, well above 104.9
      expect(pitcherUpdate.reservedBalance).toMatchObject({ n: 104.9 });
    });
  });
});
