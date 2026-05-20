import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockConfirm } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockConfirm: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
}));

vi.mock('@/lib/meetingCompletion', () => ({
  confirmMeetingCompleted: mockConfirm,
}));

import { POST } from './route';

function makeReq(token?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/meeting/m/confirm-completed', {
    method: 'POST',
    headers,
    body: '{}',
  });
}
const ctx = { params: Promise.resolve({ id: 'm' }) };

beforeEach(() => { vi.clearAllMocks(); });

describe('POST /api/meeting/[id]/confirm-completed', () => {
  it('401 without auth', async () => {
    const res = await POST(makeReq(), ctx);
    expect(res.status).toBe(401);
  });

  it('404 when meeting missing', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockConfirm.mockResolvedValue({ kind: 'not-found' });
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(404);
  });

  it('403 when caller is not pitcher or listener', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockConfirm.mockResolvedValue({ kind: 'invalid-auth' });
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(403);
  });

  it('409 when meeting is not in accepted state', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockConfirm.mockResolvedValue({ kind: 'wrong-state', status: 'reserved' });
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(409);
  });

  it('200 idempotent when already confirmed', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockConfirm.mockResolvedValue({ kind: 'already-confirmed' });
    const res = await POST(makeReq('t'), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.alreadyConfirmed).toBe(true);
  });

  it('200 with waitingFor when only one party has confirmed', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'P', email: 'p@x.com' });
    mockConfirm.mockResolvedValue({
      kind: 'partial', pitcherConfirmed: true, listenerConfirmed: false,
    });
    const res = await POST(makeReq('t'), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('accepted');
    expect(body.waitingFor).toBe('listener');
  });

  it('200 status=completed when both parties have confirmed', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' });
    mockConfirm.mockResolvedValue({
      kind: 'completed', reason: 'mutual-confirm', amount: 100,
      pitcherName: 'P', listenerName: 'L',
    });
    const res = await POST(makeReq('t'), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('completed');
    expect(body.amount).toBe(100);
  });

  it('500 on unexpected error', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockConfirm.mockRejectedValue(new Error('boom'));
    const res = await POST(makeReq('t'), ctx);
    expect(res.status).toBe(500);
  });
});
