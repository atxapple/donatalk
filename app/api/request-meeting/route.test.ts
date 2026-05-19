import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockRunTransaction, mockMeetingsWhere, mockSendPendingEmail } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockMeetingsWhere: vi.fn(),
  mockSendPendingEmail: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
  adminDb: {
    collection: (name: string) => {
      if (name === 'meetings') {
        return {
          where: mockMeetingsWhere,
          doc: () => ({ id: 'new-meeting' }),
        };
      }
      return { doc: () => ({}) };
    },
    runTransaction: mockRunTransaction,
  },
}));

vi.mock('@/lib/meetingTokens', () => ({
  generateToken: () => ({ raw: 'r', hash: 'h' }),
}));

vi.mock('@/lib/meetingEmails', () => ({
  sendPendingRequestEmailToPitcher: mockSendPendingEmail,
}));

import { POST } from './route';

function makeRequest(body: unknown, token?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/request-meeting', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSendPendingEmail.mockResolvedValue(undefined);
  mockMeetingsWhere.mockReturnValue({ limit: () => ({ get: () => Promise.resolve({ empty: true, docs: [] }) }) });
});

describe('POST /api/request-meeting', () => {
  it('returns 401 without auth', async () => {
    const res = await POST(makeRequest({ pitcherId: 'P', availability: 'a', idempotencyKey: 'k' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when self-requesting', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    const res = await POST(makeRequest({ pitcherId: 'L', availability: 'a', idempotencyKey: 'k' }, 't'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when pitcherId missing', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    const res = await POST(makeRequest({ availability: 'a', idempotencyKey: 'k' }, 't'));
    expect(res.status).toBe(400);
  });

  it('replays idempotency hit', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    mockMeetingsWhere.mockReturnValue({
      limit: () => ({
        get: () => Promise.resolve({
          empty: false,
          docs: [{ id: 'existing', data: () => ({ status: 'pending', reservedAmount: 100 }) }],
        }),
      }),
    });
    const res = await POST(makeRequest({ pitcherId: 'P', availability: 'a', idempotencyKey: 'k' }, 't'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.idempotentReplay).toBe(true);
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('returns 409 when pitcher link inactive', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    mockRunTransaction.mockImplementation(async () => ({
      error: { status: 409, code: 'pitcher-link-inactive', message: 'inactive' },
    }));
    const res = await POST(makeRequest({ pitcherId: 'P', availability: 'a', idempotencyKey: 'k' }, 't'));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('pitcher-link-inactive');
  });

  it('returns 404 when pitcher missing', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    mockRunTransaction.mockImplementation(async () => ({ error: { status: 404, message: 'Pitcher not found' } }));
    const res = await POST(makeRequest({ pitcherId: 'P', availability: 'a', idempotencyKey: 'k' }, 't'));
    expect(res.status).toBe(404);
  });

  it('returns 200 and sends email on happy path', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    mockRunTransaction.mockImplementation(async () => ({
      ok: {
        meetingId: 'new-meeting',
        rawToken: 'r',
        reservedAmount: 100,
        pitcherName: 'P Name',
        pitcherEmail: 'p@x.com',
        listenerName: 'L Name',
        donationAmount: 95,
        availability: 'Mon',
      },
    }));

    const res = await POST(makeRequest({ pitcherId: 'P', availability: 'Mon', idempotencyKey: 'k' }, 't'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('pending');
    expect(body.meetingId).toBe('new-meeting');
    expect(mockSendPendingEmail).toHaveBeenCalledOnce();
  });
});
