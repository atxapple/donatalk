import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
}));

import { verifyUser } from './verifyUser';
import { NextResponse } from 'next/server';

function createRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/test', { method: 'POST', headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('verifyUser', () => {
  it('returns 401 when no Authorization header', async () => {
    const result = await verifyUser(createRequest());
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 when header has no Bearer prefix', async () => {
    const req = new Request('http://localhost:3000/api/test', {
      headers: { Authorization: 'Token xyz' },
    });
    const result = await verifyUser(req);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 when token verification throws', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('expired'));
    const result = await verifyUser(createRequest('bad-token'));
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 when uid is missing from decoded token', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'u@x.com' });
    const result = await verifyUser(createRequest('tkn'));
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 when email is missing from decoded token', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'abc' });
    const result = await verifyUser(createRequest('tkn'));
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns uid and email for a valid token', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'uid-1', email: 'a@b.com' });
    const result = await verifyUser(createRequest('valid'));
    expect(result).toEqual({ uid: 'uid-1', email: 'a@b.com' });
  });

  it('does not reject non-admin emails (unlike verifyAdmin)', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'uid-2', email: 'random@user.com' });
    const result = await verifyUser(createRequest('valid'));
    expect(result).toEqual({ uid: 'uid-2', email: 'random@user.com' });
  });
});
