import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockRunTransaction, mockSendCancel } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockSendCancel: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
  adminDb: {
    collection: () => ({ doc: () => ({ id: 'm' }) }),
    runTransaction: mockRunTransaction,
  },
}));

vi.mock('@/lib/meetingEmails', () => ({
  sendCancellationNoticeToOwner: mockSendCancel,
}));

import { POST } from './route';

function makeReq(token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/meeting/m/cancel', {
    method: 'POST',
    headers,
    body: '{}',
  });
}
const ctx = { params: Promise.resolve({ id: 'm' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendCancel.mockResolvedValue(undefined);
});

describe('POST /api/meeting/[id]/cancel', () => {
  it('401 without auth', async () => {
    const res = await POST(makeReq(), ctx);
    expect(res.status).toBe(401);
  });

  it('404 when meeting missing', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockRunTransaction.mockImplementation(async () => ({ kind: 'not-found' }));
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(404);
  });

  it('403 when caller is not the visitor side', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockRunTransaction.mockImplementation(async () => ({ kind: 'forbidden' }));
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(403);
  });

  it('409 when already accepted/declined/cancelled', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockRunTransaction.mockImplementation(async () => ({ kind: 'terminal', status: 'accepted' }));
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(409);
  });

  it('reserved→cancelled returns releasedAmount and notifies owner', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'cancelled',
      wasReserved: true,
      amount: 75,
      visitorRole: 'pitcher',
      ownerName: 'Lara',
      ownerEmail: 'l@x.com',
      visitorName: 'Pia',
    }));
    const res = await POST(makeReq('t'), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.cancelled).toBe(true);
    expect(body.releasedAmount).toBe(75);
    expect(mockSendCancel).toHaveBeenCalledWith(expect.objectContaining({
      visitorRole: 'pitcher',
      recipientEmail: 'l@x.com',
    }));
  });

  it('pending→cancelled returns 0 releasedAmount', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'cancelled',
      wasReserved: false,
      amount: 0,
      visitorRole: 'listener',
      ownerName: 'Pia',
      ownerEmail: 'p@x.com',
      visitorName: 'Lara',
    }));
    const res = await POST(makeReq('t'), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.releasedAmount).toBe(0);
  });

  it('still succeeds when notice email fails', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'cancelled',
      wasReserved: true,
      amount: 10,
      visitorRole: 'pitcher',
      ownerName: 'L',
      ownerEmail: 'l@x.com',
      visitorName: 'P',
    }));
    mockSendCancel.mockRejectedValue(new Error('SMTP'));
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(200);
  });
});
