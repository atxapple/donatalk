import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockGet, mockOrderBy, mockCollection } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockOrderBy = vi.fn().mockReturnValue({ get: mockGet });
  const mockCollection = vi.fn().mockReturnValue({ get: mockGet, orderBy: mockOrderBy });
  return {
    mockVerifyIdToken: vi.fn(),
    mockGet,
    mockOrderBy,
    mockCollection,
  };
});

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
  adminDb: { collection: mockCollection },
}));

vi.mock('@/lib/adminConfig', () => ({
  isAdminEmail: (email: string | null | undefined) => {
    return email === 'yunyoungmokk@gmail.com' || email === 'atxapplellc@gmail.com';
  },
}));

import { GET } from './route';

function createAdminRequest(tab?: string, token?: string): Request {
  const url = `http://localhost:3000/api/admin${tab ? `?tab=${tab}` : ''}`;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, { method: 'GET', headers });
}

const emptySnap = { docs: [] };

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue(emptySnap);
  mockOrderBy.mockReturnValue({ get: mockGet });
  mockCollection.mockReturnValue({ get: mockGet, orderBy: mockOrderBy });
});

describe('GET /api/admin', () => {
  it('returns 401 when no auth header', async () => {
    const req = createAdminRequest();
    const res = await GET(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Missing authorization');
  });

  it('returns 401 when token is invalid', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
    const req = createAdminRequest('dashboard', 'bad-token');
    const res = await GET(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Invalid token');
  });

  it('returns 403 when user is not admin', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'nonadmin@example.com' });
    const req = createAdminRequest('dashboard', 'valid-token');
    const res = await GET(req as any);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns 200 with dashboard data', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
    mockGet.mockResolvedValue({
      docs: [
        { data: () => ({ fullName: 'Alice', donation: 100, credit_balance: 200, isSetUp: true }) },
      ],
    });

    const req = createAdminRequest('dashboard', 'valid-token');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveProperty('totalPitchers');
    expect(json.data).toHaveProperty('totalListeners');
    expect(json.data).toHaveProperty('activePitchers');
    expect(json.data).toHaveProperty('totalMeetings');
    expect(json.data).toHaveProperty('totalFundsRaised');
    expect(json.data).toHaveProperty('totalTransactions');
  });

  it('returns 200 with pitchers array', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
    mockGet.mockResolvedValue({
      docs: [{ id: 'p1', data: () => ({ fullName: 'Alice', email: 'alice@test.com' }) }],
    });

    const req = createAdminRequest('pitchers', 'valid-token');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0]).toHaveProperty('fullName', 'Alice');
    expect(json.data[0]).toHaveProperty('id', 'p1');
  });

  it('returns 400 for invalid tab', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
    const req = createAdminRequest('invalid_tab', 'valid-token');
    const res = await GET(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid tab');
  });
});
