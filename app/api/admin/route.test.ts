import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockGet, mockOrderBy, mockDoc, mockGetAll, mockCollection } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockOrderBy = vi.fn().mockReturnValue({ get: mockGet });
  const mockDoc = vi.fn().mockReturnValue({ id: 'mock-ref' });
  const mockGetAll = vi.fn().mockResolvedValue([]);
  const mockCollection = vi.fn().mockReturnValue({ get: mockGet, orderBy: mockOrderBy, doc: mockDoc });
  return {
    mockVerifyIdToken: vi.fn(),
    mockGet,
    mockOrderBy,
    mockDoc,
    mockGetAll,
    mockCollection,
  };
});

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
  adminDb: { collection: mockCollection, getAll: mockGetAll },
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
  mockGetAll.mockResolvedValue([]);
  mockOrderBy.mockReturnValue({ get: mockGet });
  mockDoc.mockReturnValue({ id: 'mock-ref' });
  mockCollection.mockReturnValue({ get: mockGet, orderBy: mockOrderBy, doc: mockDoc });
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

  describe('fund_history tab', () => {
    it('resolves pitcherId to pitcherEmail', async () => {
      mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
      mockGet.mockResolvedValue({
        docs: [
          { id: 'fh1', data: () => ({ pitcherId: 'p1', amount: 10, eventType: 'add_fund' }) },
          { id: 'fh2', data: () => ({ pitcherId: 'p2', amount: 20, eventType: 'add_fund' }) },
        ],
      });
      mockDoc.mockImplementation((id: string) => ({ id }));
      mockGetAll.mockResolvedValue([
        { id: 'p1', exists: true, data: () => ({ email: 'alice@test.com' }) },
        { id: 'p2', exists: true, data: () => ({ email: 'bob@test.com' }) },
      ]);

      const req = createAdminRequest('fund_history', 'valid-token');
      const res = await GET(req as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data[0].pitcherEmail).toBe('alice@test.com');
      expect(json.data[1].pitcherEmail).toBe('bob@test.com');
    });

    it('falls back to pitcherId when pitcher doc does not exist', async () => {
      mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
      mockGet.mockResolvedValue({
        docs: [
          { id: 'fh1', data: () => ({ pitcherId: 'deleted-uid', amount: 5 }) },
        ],
      });
      mockDoc.mockImplementation((id: string) => ({ id }));
      mockGetAll.mockResolvedValue([
        { id: 'deleted-uid', exists: false, data: () => undefined },
      ]);

      const req = createAdminRequest('fund_history', 'valid-token');
      const res = await GET(req as any);
      const json = await res.json();
      expect(json.data[0].pitcherEmail).toBe('deleted-uid');
    });

    it('returns dash when pitcherId is missing', async () => {
      mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });
      mockGet.mockResolvedValue({
        docs: [
          { id: 'fh1', data: () => ({ amount: 5 }) },
        ],
      });

      const req = createAdminRequest('fund_history', 'valid-token');
      const res = await GET(req as any);
      const json = await res.json();
      expect(json.data[0].pitcherEmail).toBe('—');
    });
  });
});
