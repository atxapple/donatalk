import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRunTransaction, mockSendDecline } = vi.hoisted(() => ({
  mockRunTransaction: vi.fn(),
  mockSendDecline: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    collection: () => ({ doc: () => ({ id: 'm' }) }),
    runTransaction: mockRunTransaction,
  },
}));

vi.mock('@/lib/meetingTokens', () => ({
  verifyToken: vi.fn(() => true),
}));

vi.mock('@/lib/meetingEmails', () => ({
  sendDeclineNoticeToVisitor: mockSendDecline,
}));

import { GET } from './route';

function makeReq(token?: string) {
  const url = token
    ? `http://localhost:3000/api/meeting/m/decline?token=${token}`
    : `http://localhost:3000/api/meeting/m/decline`;
  return new Request(url, { method: 'GET' });
}
const ctx = { params: Promise.resolve({ id: 'm' }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendDecline.mockResolvedValue(undefined);
});

describe('GET /api/meeting/[id]/decline', () => {
  it('400 when token missing', async () => {
    const res = await GET(makeReq(), ctx);
    expect(res.status).toBe(400);
  });

  it('404 when meeting missing', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'not-found' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(404);
  });

  it('403 on invalid token', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'invalid-token' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(403);
  });

  it('shows terminal-state for already-handled meeting', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'terminal-state', status: 'declined' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Already declined');
  });

  it('reserved→declined releases reservation, mentions release in page + email', async () => {
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'declined',
      wasReserved: true,
      amount: 100,
      visitorRole: 'pitcher',
      recipientName: 'Pia',
      recipientEmail: 'p@x.com',
      otherPartyName: 'Lara',
    }));
    const res = await GET(makeReq('t'), ctx);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('reservation has been released');
    expect(mockSendDecline).toHaveBeenCalledWith(expect.objectContaining({
      recipientName: 'Pia',
      amountReleased: 100,
    }));
  });

  it('pending→declined sends notice without release amount', async () => {
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'declined',
      wasReserved: false,
      amount: 0,
      visitorRole: 'listener',
      recipientName: 'Lara',
      recipientEmail: 'l@x.com',
      otherPartyName: 'Pia',
    }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    expect(mockSendDecline).toHaveBeenCalledWith(expect.objectContaining({
      amountReleased: null,
    }));
  });

  it('shows already-used page when tokenUsed', async () => {
    mockRunTransaction.mockImplementation(async () => ({ kind: 'token-used' }));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Already Used');
  });

  it('returns 500 on unexpected error', async () => {
    mockRunTransaction.mockRejectedValue(new Error('firestore broken'));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(500);
  });

  it('still succeeds when decline email fails', async () => {
    mockRunTransaction.mockImplementation(async () => ({
      kind: 'declined',
      wasReserved: false,
      amount: 0,
      visitorRole: 'listener',
      recipientName: 'L',
      recipientEmail: 'l@x.com',
      otherPartyName: 'P',
    }));
    mockSendDecline.mockRejectedValue(new Error('SMTP'));
    const res = await GET(makeReq('t'), ctx);
    expect(res.status).toBe(200);
  });
});
