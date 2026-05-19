import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockVerifyIdToken, mockGet, mockUpdate, mockDoc, mockWhere, mockCollection, mockRunTransaction } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockUpdate = vi.fn();
  const mockDoc = vi.fn();
  const mockWhere = vi.fn();
  const mockCollection = vi.fn();
  const mockRunTransaction = vi.fn();
  return {
    mockVerifyIdToken: vi.fn(),
    mockGet,
    mockUpdate,
    mockDoc,
    mockWhere,
    mockCollection,
    mockRunTransaction,
  };
});

vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: mockVerifyIdToken },
  adminDb: { collection: mockCollection, runTransaction: mockRunTransaction },
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
    increment: (n: number) => ({ _type: 'increment', n }),
  },
  Timestamp: {
    now: () => ({ _type: 'timestamp-now' }),
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
    const pairedGet = vi.fn().mockResolvedValue({ exists: false });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    const meetingsWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [], empty: true }) }),
      }),
    });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc }) // pitchers (delete target)
      .mockReturnValueOnce({ where: meetingsWhere }) // meetings sweep
      .mockReturnValueOnce({ doc: pairedDoc }); // listeners (paired)

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.deleted).toBe(true);
    expect(data.hasPairedProfile).toBe(false);
    expect(data.pairedCollection).toBe('listeners');
    expect(data.meetingsCancelled).toBe(0);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ isSetUp: false })
    );
  });

  it('returns hasPairedProfile: true when paired doc exists', async () => {
    const pairedGet = vi.fn().mockResolvedValue({ exists: true });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    const meetingsWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [], empty: true }) }),
      }),
    });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc })
      .mockReturnValueOnce({ where: meetingsWhere })
      .mockReturnValueOnce({ doc: pairedDoc });

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.hasPairedProfile).toBe(true);
    expect(data.pairedCollection).toBe('listeners');
  });

  it('listener-side delete sweeps meetings matching listenerId', async () => {
    const pairedGet = vi.fn().mockResolvedValue({ exists: true });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    const meetingDoc = {
      id: 'm2',
      ref: { id: 'm2' },
      data: () => ({ status: 'pending', listenerId: 'abc123', pitcherId: 'someP', reservedAmount: 50, paymentSource: 'pitcher-balance' }),
    };
    const firstWhere = vi.fn();
    const secondWhere = vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [meetingDoc], empty: false }) });
    firstWhere.mockReturnValue({ where: secondWhere });
    const meetingsWhere = vi.fn().mockReturnValue({ where: firstWhere });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc })
      .mockReturnValueOnce({ where: meetingsWhere })
      .mockReturnValueOnce({ doc: pairedDoc });
    mockRunTransaction.mockImplementation(async (cb) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => meetingDoc.data() }),
        update: vi.fn(),
      };
      return cb(tx);
    });

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('listeners', 'abc123'));
    expect(res.status).toBe(200);
    expect(meetingsWhere).toHaveBeenCalledWith('listenerId', '==', 'abc123');
  });

  it('does not sweep meetings already in terminal states', async () => {
    const pairedGet = vi.fn().mockResolvedValue({ exists: false });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    // Even if the query somehow returned a terminal-state doc, the in-transaction
    // re-check should skip it (defensive against stale snapshots).
    const meetingDoc = {
      id: 'm3',
      ref: { id: 'm3' },
      data: () => ({ status: 'accepted', pitcherId: 'abc123', reservedAmount: 100 }),
    };
    const meetingsWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [meetingDoc], empty: false }) }),
      }),
    });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc })
      .mockReturnValueOnce({ where: meetingsWhere })
      .mockReturnValueOnce({ doc: pairedDoc });

    let txUpdateCount = 0;
    mockRunTransaction.mockImplementation(async (cb) => {
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => meetingDoc.data() }),
        update: vi.fn(() => { txUpdateCount += 1; }),
      };
      return cb(tx);
    });

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);
    // Transaction returned early — no updates should have been applied
    expect(txUpdateCount).toBe(0);
  });

  it('sweep continues if one meeting transaction fails', async () => {
    const pairedGet = vi.fn().mockResolvedValue({ exists: false });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    const m1 = { id: 'm1', ref: { id: 'm1' }, data: () => ({ status: 'reserved', pitcherId: 'abc123', reservedAmount: 50 }) };
    const m2 = { id: 'm2', ref: { id: 'm2' }, data: () => ({ status: 'reserved', pitcherId: 'abc123', reservedAmount: 75 }) };
    const meetingsWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [m1, m2], empty: false }) }),
      }),
    });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc })
      .mockReturnValueOnce({ where: meetingsWhere })
      .mockReturnValueOnce({ doc: pairedDoc });

    let call = 0;
    mockRunTransaction.mockImplementation(async (cb) => {
      call += 1;
      if (call === 1) throw new Error('contention');
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => m2.data() }),
        update: vi.fn(),
      };
      return cb(tx);
    });

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);
    const data = await res.json();
    // Only the second meeting was successfully cancelled
    expect(data.meetingsCancelled).toBe(1);
  });

  it('sweeps reserved meetings: cancels them and releases reservations', async () => {
    const pairedGet = vi.fn().mockResolvedValue({ exists: false });
    const pairedDoc = vi.fn().mockReturnValue({ get: pairedGet });
    const meetingDoc = {
      id: 'm1',
      ref: { id: 'm1' },
      data: () => ({ status: 'reserved', pitcherId: 'abc123', reservedAmount: 100 }),
    };
    const meetingsWhere = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [meetingDoc], empty: false }) }),
      }),
    });
    mockCollection
      .mockReturnValueOnce({ doc: mockDoc })
      .mockReturnValueOnce({ where: meetingsWhere })
      .mockReturnValueOnce({ doc: pairedDoc });
    mockRunTransaction.mockImplementation(async (cb) => {
      // Simulate tx providing a fresh snap that confirms status
      const tx = {
        get: vi.fn().mockResolvedValue({ exists: true, data: () => meetingDoc.data() }),
        update: vi.fn(),
      };
      return cb(tx);
    });

    const req = createRequest('DELETE', undefined, adminToken);
    const res = await DELETE(req, makeContext('pitchers', 'abc123'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.meetingsCancelled).toBe(1);
    expect(mockRunTransaction).toHaveBeenCalledOnce();
  });
});
