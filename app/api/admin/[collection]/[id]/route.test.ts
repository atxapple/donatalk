import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockGet, mockUpdate, mockDoc, mockWhere, mockCollection } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockUpdate = vi.fn();
  const mockDoc = vi.fn();
  const mockWhere = vi.fn();
  const mockCollection = vi.fn();
  return {
    mockVerifyIdToken: vi.fn(),
    mockGet,
    mockUpdate,
    mockDoc,
    mockWhere,
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

vi.mock('slugify', () => ({
  default: (str: string, _opts?: unknown) => str.toLowerCase().replace(/[^a-z0-9]/g, ''),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => ({ _type: 'serverTimestamp' }),
    delete: () => ({ _type: 'deleteField' }),
  },
}));

import { PATCH, DELETE } from './route';

function createRequest(method: string, body?: object, token?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request('http://localhost:3000/api/admin/pitchers/abc123', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeContext(collection: string, id: string) {
  return { params: Promise.resolve({ collection, id }) };
}

const adminToken = 'valid-admin-token';

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyIdToken.mockResolvedValue({ email: 'yunyoungmokk@gmail.com' });

  // Default: doc exists, no deletedAt
  const docData = { fullName: 'Alice', email: 'alice@test.com', donation: 100, pitch: 'My cause', slug: 'alice', isSetUp: true };
  const docRef = { get: mockGet, update: mockUpdate };
  mockGet.mockResolvedValue({ exists: true, id: 'abc123', data: () => docData });
  mockUpdate.mockResolvedValue(undefined);
  mockDoc.mockReturnValue(docRef);
  mockWhere.mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [], empty: true }) });
  mockCollection.mockReturnValue({ doc: mockDoc, where: mockWhere });
});

describe('PATCH /api/admin/[collection]/[id]', () => {
  it('returns 401 when no auth header', async () => {
    const req = createRequest('PATCH', { fullName: 'Bob' });
    const res = await PATCH(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for disallowed collection', async () => {
    const req = createRequest('PATCH', { fullName: 'Bob' }, adminToken);
    const res = await PATCH(req, makeContext('meetings', 'abc123'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid collection');
  });

  it('returns 400 when no valid fields provided', async () => {
    const req = createRequest('PATCH', { email: 'hack@evil.com', createdAt: 'now' }, adminToken);
    const res = await PATCH(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('No valid fields');
  });

  it('returns 404 when document not found', async () => {
    mockGet.mockResolvedValue({ exists: false });
    const req = createRequest('PATCH', { fullName: 'Bob' }, adminToken);
    const res = await PATCH(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(404);
  });

  it('returns 200 and updates document, stripping disallowed fields', async () => {
    // After update, return updated data
    mockGet
      .mockResolvedValueOnce({ exists: true, id: 'abc123', data: () => ({ fullName: 'Alice', email: 'alice@test.com', donation: 100, slug: 'alice', isSetUp: true }) })
      .mockResolvedValueOnce({ exists: true, id: 'abc123', data: () => ({ fullName: 'Alice', email: 'alice@test.com', donation: 50, slug: 'alice', isSetUp: true }) });

    const req = createRequest('PATCH', { donation: '50', email: 'hack@evil.com', createdAt: 'now' }, adminToken);
    const res = await PATCH(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);

    // Verify update was called with only allowed fields
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ donation: 50 })
    );
    // email and createdAt should not be in the update
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('email');
    expect(updateArg).not.toHaveProperty('createdAt');
  });

  it('clears deletedAt when isSetUp set to true on soft-deleted doc (restore)', async () => {
    mockGet
      .mockResolvedValueOnce({ exists: true, id: 'abc123', data: () => ({ fullName: 'Alice', email: 'alice@test.com', donation: 100, slug: 'alice', isSetUp: false, deletedAt: { _seconds: 12345 } }) })
      .mockResolvedValueOnce({ exists: true, id: 'abc123', data: () => ({ fullName: 'Alice', email: 'alice@test.com', donation: 100, slug: 'alice', isSetUp: true }) });

    const req = createRequest('PATCH', { isSetUp: true }, adminToken);
    const res = await PATCH(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.isSetUp).toBe(true);
    expect(updateArg.deletedAt).toEqual({ _type: 'deleteField' });
  });
});

describe('DELETE /api/admin/[collection]/[id]', () => {
  it('returns 401 when no auth header', async () => {
    const req = createRequest('DELETE');
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for disallowed collection', async () => {
    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('fund_history', 'abc123'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when document not found', async () => {
    mockGet.mockResolvedValue({ exists: false });
    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(404);
  });

  it('returns 200 and soft-deletes (sets deletedAt + isSetUp: false)', async () => {
    // First get: doc exists, second get: paired doc check
    const pairedGet = vi.fn().mockResolvedValue({ exists: false });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc }) // pitchers collection
      .mockReturnValueOnce({ doc: pairedDoc }); // listeners collection (paired)

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.deleted).toBe(true);
    expect(data.hasPairedProfile).toBe(false);
    expect(data.pairedCollection).toBe('listeners');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ isSetUp: false })
    );
  });

  it('returns hasPairedProfile: true when paired doc exists', async () => {
    const pairedGet = vi.fn().mockResolvedValue({ exists: true });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc })
      .mockReturnValueOnce({ doc: pairedDoc });

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.hasPairedProfile).toBe(true);
    expect(data.pairedCollection).toBe('listeners');
  });
});
