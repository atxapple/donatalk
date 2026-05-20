import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockAccept, mockDecline, mockSendAccept, mockSendDecline } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockAccept: vi.fn(),
  mockDecline: vi.fn(),
  mockSendAccept: vi.fn(),
  mockSendDecline: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
}));

vi.mock('@/lib/meetingActions', () => ({
  acceptMeeting: mockAccept,
  declineMeeting: mockDecline,
}));

vi.mock('@/lib/meetingEmails', () => ({
  sendAcceptConfirmationEmail: mockSendAccept,
  sendDeclineNoticeToVisitor: mockSendDecline,
}));

import { POST } from './route';

function makeReq(body: unknown, token?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/meeting/m/respond', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}
const ctx = { params: Promise.resolve({ id: 'm' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendAccept.mockResolvedValue(undefined);
  mockSendDecline.mockResolvedValue(undefined);
});

describe('POST /api/meeting/[id]/respond', () => {
  it('401 without auth header', async () => {
    const res = await POST(makeReq({ action: 'accept' }), ctx);
    expect(res.status).toBe(401);
  });

  it('401 when token verification fails', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('bad'));
    const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
    expect(res.status).toBe(401);
  });

  it('400 on malformed JSON', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    const req = new Request('http://localhost:3000/api/meeting/m/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t' },
      body: 'not-json',
    });
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
  });

  it('400 when action is missing', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    const res = await POST(makeReq({}, 't'), ctx);
    expect(res.status).toBe(400);
  });

  it('400 when action is unknown', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    const res = await POST(makeReq({ action: 'invalidate' }, 't'), ctx);
    expect(res.status).toBe(400);
  });

  describe('accept', () => {
    beforeEach(() => mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' }));

    it('404 when meeting not found', async () => {
      mockAccept.mockResolvedValue({ kind: 'not-found' });
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      expect(res.status).toBe(404);
    });

    it('403 when caller is not the owner', async () => {
      mockAccept.mockResolvedValue({ kind: 'invalid-auth' });
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      expect(res.status).toBe(403);
    });

    it('409 when meeting already in terminal state', async () => {
      mockAccept.mockResolvedValue({ kind: 'terminal-state', status: 'accepted' });
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.status).toBe('accepted');
    });

    it('410 when expired', async () => {
      mockAccept.mockResolvedValue({ kind: 'expired' });
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      expect(res.status).toBe(410);
    });

    it('410 when pitcher soft-deleted', async () => {
      mockAccept.mockResolvedValue({ kind: 'pitcher-gone' });
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      expect(res.status).toBe(410);
    });

    it('409 with available + required when balance insufficient (pending-mode commit)', async () => {
      mockAccept.mockResolvedValue({ kind: 'insufficient-balance', available: 10, required: 50 });
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('pitcher-balance-insufficient');
      expect(body.available).toBe(10);
      expect(body.required).toBe(50);
    });

    it('200 happy path sends two confirmation emails', async () => {
      mockAccept.mockResolvedValue({
        kind: 'accepted',
        amount: 100,
        pitcherName: 'P',
        pitcherEmail: 'p@x.com',
        listenerName: 'L',
        listenerEmail: 'l@x.com',
      });
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.action).toBe('accepted');
      expect(body.amount).toBe(100);
      expect(mockSendAccept).toHaveBeenCalledTimes(2);
    });

    it('200 still returned when confirmation emails fail', async () => {
      mockAccept.mockResolvedValue({
        kind: 'accepted', amount: 50,
        pitcherName: 'P', pitcherEmail: 'p@x.com', listenerName: 'L', listenerEmail: 'l@x.com',
      });
      mockSendAccept.mockRejectedValue(new Error('SMTP'));
      const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
      expect(res.status).toBe(200);
    });
  });

  describe('decline', () => {
    beforeEach(() => mockVerifyIdToken.mockResolvedValue({ uid: 'L', email: 'l@x.com' }));

    it('reserved→declined returns releasedAmount and notifies visitor', async () => {
      mockDecline.mockResolvedValue({
        kind: 'declined', wasReserved: true, amount: 75,
        visitorRole: 'pitcher', recipientName: 'P', recipientEmail: 'p@x.com', otherPartyName: 'L',
      });
      const res = await POST(makeReq({ action: 'decline' }, 't'), ctx);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.action).toBe('declined');
      expect(body.releasedAmount).toBe(75);
      expect(mockSendDecline).toHaveBeenCalledWith(expect.objectContaining({ amountReleased: 75 }));
    });

    it('pending→declined returns 0 releasedAmount and notifies visitor', async () => {
      mockDecline.mockResolvedValue({
        kind: 'declined', wasReserved: false, amount: 0,
        visitorRole: 'listener', recipientName: 'L', recipientEmail: 'l@x.com', otherPartyName: 'P',
      });
      const res = await POST(makeReq({ action: 'decline' }, 't'), ctx);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.releasedAmount).toBe(0);
      expect(mockSendDecline).toHaveBeenCalledWith(expect.objectContaining({ amountReleased: null }));
    });

    it('403 when caller is not the owner', async () => {
      mockDecline.mockResolvedValue({ kind: 'invalid-auth' });
      const res = await POST(makeReq({ action: 'decline' }, 't'), ctx);
      expect(res.status).toBe(403);
    });

    it('409 in terminal state', async () => {
      mockDecline.mockResolvedValue({ kind: 'terminal-state', status: 'cancelled' });
      const res = await POST(makeReq({ action: 'decline' }, 't'), ctx);
      expect(res.status).toBe(409);
    });

    it('still 200 when decline-notice email fails', async () => {
      mockDecline.mockResolvedValue({
        kind: 'declined', wasReserved: false, amount: 0,
        visitorRole: 'listener', recipientName: 'L', recipientEmail: 'l@x.com', otherPartyName: 'P',
      });
      mockSendDecline.mockRejectedValue(new Error('SMTP'));
      const res = await POST(makeReq({ action: 'decline' }, 't'), ctx);
      expect(res.status).toBe(200);
    });
  });

  it('500 on unexpected error', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'U', email: 'u@x.com' });
    mockAccept.mockRejectedValue(new Error('firestore broken'));
    const res = await POST(makeReq({ action: 'accept' }, 't'), ctx);
    expect(res.status).toBe(500);
  });
});
