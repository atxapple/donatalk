import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
}));

vi.mock('@/lib/adminConfig', () => ({
  isAdminEmail: (email: string | null | undefined) => {
    return email === 'yunyoungmokk@gmail.com' || email === 'atxapplellc@gmail.com';
  },
}));

import { verifyAdmin } from './adminAuth';
import { NextResponse } from 'next/server';

function createRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/admin', { method: 'GET', headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('verifyAdmin', () => {
  it('returns 401 when no Authorization header', async () => {
    const result = await verifyAdmin(createRequest());
    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Missing authorization');
  });

  it('returns 401 when Authorization header has no Bearer prefix', async () => {
    const req = new Request('http://localhost:3000/api/admin', {
      headers: { Authorization: 'Token abc123' },
    });
    const result = await verifyAdmin(req);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 when token verification fails', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));
    const result = await verifyAdmin(createRequest('bad-token'));
    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Invalid token');
  });

  it('returns 403 when user is not an admin', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'user@example.com' });
    const result = await verifyAdmin(createRequest('valid-token'));
    expect(result).toBeInstanceOf(NextResponse);
    const res = result as NextResponse;
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns email object for valid admin (yunyoungmokk)', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
    const result = await verifyAdmin(createRequest('valid-token'));
    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ email: 'yunyoungmokk@gmail.com' });
  });

  it('returns email object for valid admin (atxapplellc)', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'atxapplellc@gmail.com' });
    const result = await verifyAdmin(createRequest('valid-token'));
    expect(result).not.toBeInstanceOf(NextResponse);
    expect(result).toEqual({ email: 'atxapplellc@gmail.com' });
  });

  it('extracts token correctly from Bearer header', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
    await verifyAdmin(createRequest('my-test-token-123'));
    expect(mockVerifyIdToken).toHaveBeenCalledWith('my-test-token-123');
  });
});
