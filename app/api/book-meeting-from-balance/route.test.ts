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

    it('returns 200 with meeting info and triggers email', async () => {
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
        listenerEmail: 'lara@x.com',
        amount: 104.9,
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
});
