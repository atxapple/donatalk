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
});
