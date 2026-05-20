import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockRefund } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockRefund: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
}));

vi.mock('@/lib/meetingCompletion', () => ({
  refundMeeting: mockRefund,
}));

import { POST } from './route';

function makeReq(token?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/meeting/m/report-no-show', {
    method: 'POST',
    headers,
    body: '{}',
  });
}
const ctx = { params: Promise.resolve({ id: 'm' }) };

beforeEach(() => { vi.clearAllMocks(); });

describe('POST /api/meeting/[id]/report-no-show', () => {
  it('401 without auth', async () => {
    const res = await POST(makeReq(), ctx);
    expect(res.status).toBe(401);
  });

  it('404 when meeting missing', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockRefund.mockResolvedValue({ kind: 'not-found' });
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(404);
  });

  it('403 when caller is not a party', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockRefund.mockResolvedValue({ kind: 'invalid-auth' });
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(403);
  });

  it('409 when meeting is not in accepted state', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockRefund.mockResolvedValue({ kind: 'wrong-state', status: 'completed' });
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(409);
  });

  it('200 with refundedAmount and reason on success (pitcher reports)', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
    mockRefund.mockResolvedValue({
      kind: 'refunded', amount: 100, reason: 'no-show-by-listener',
      pitcherName: 'P', pitcherEmail: 'p@x.com', listenerName: 'L', listenerEmail: 'l@x.com',
    });
    const res = await POST(makeReq('t'), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('refunded');
    expect(body.refundedAmount).toBe(100);
    expect(body.reason).toBe('no-show-by-listener');
  });

  it('200 with reason no-show-by-pitcher when listener reports', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    mockRefund.mockResolvedValue({
      kind: 'refunded', amount: 50, reason: 'no-show-by-pitcher',
      pitcherName: 'P', pitcherEmail: 'p@x.com', listenerName: 'L', listenerEmail: 'l@x.com',
    });
    const res = await POST(makeReq('t'), ctx);
    const body = await res.json();
    expect(body.reason).toBe('no-show-by-pitcher');
  });

  it('500 on unexpected error', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockRefund.mockRejectedValue(new Error('firestore error'));
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(500);
  });
});
