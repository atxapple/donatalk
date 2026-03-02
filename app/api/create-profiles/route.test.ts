import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSet, mockCommit, mockBatch, mockGet, mockWhere, mockCollection, mockDoc } = vi.hoisted(() => {
  const mockSet = vi.fn();
  const mockCommit = vi.fn();
  const mockBatch = vi.fn().mockReturnValue({ set: mockSet, commit: mockCommit });
  const mockGet = vi.fn();
  const mockWhere = vi.fn();
  const mockDoc = vi.fn();
  const mockCollection = vi.fn();
  return { mockSet, mockCommit, mockBatch, mockGet, mockWhere, mockDoc, mockCollection };
});

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{ name: 'test' }],
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => {
  const collection = mockCollection;
  return {
    getFirestore: () => ({ collection, batch: mockBatch, doc: mockDoc }),
    FieldValue: { serverTimestamp: () => ({ _type: 'serverTimestamp' }) },
  };
});

vi.mock('slugify', () => ({
  default: (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, ''),
}));

import { POST } from './route';
import { createJsonRequest } from '@/test/helpers';

beforeEach(() => {
  vi.clearAllMocks();
  mockCommit.mockResolvedValue(undefined);

  // Mock doc() to return a unique ref object per call
  const docRef = { id: 'mock-doc-ref' };
  mockDoc.mockReturnValue(docRef);
  mockCollection.mockReturnValue({
    doc: mockDoc,
    where: mockWhere,
  });

  // For slug uniqueness check (both-stubs)
  mockWhere.mockReturnValue({ get: mockGet });
  mockGet.mockResolvedValue({ empty: true });
});

describe('POST /api/create-profiles', () => {
  describe('validation', () => {
    it('returns 400 when uid is missing', async () => {
      const res = await POST(createJsonRequest({ fullName: 'Test', email: 'a@b.com', role: 'pitcher' }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('Missing required fields');
    });

    it('returns 400 when fullName is missing', async () => {
      const res = await POST(createJsonRequest({ uid: '123', email: 'a@b.com', role: 'pitcher' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when email is missing', async () => {
      const res = await POST(createJsonRequest({ uid: '123', fullName: 'Test', role: 'pitcher' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when role is missing', async () => {
      const res = await POST(createJsonRequest({ uid: '123', fullName: 'Test', email: 'a@b.com' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid role', async () => {
      const res = await POST(createJsonRequest({
        uid: '123', fullName: 'Test', email: 'a@b.com', role: 'invalid',
      }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.message).toContain('Invalid role');
    });
  });

  describe('pitcher role', () => {
    it('creates both pitcher (isSetUp: true) and listener (isSetUp: false) profiles', async () => {
      const res = await POST(createJsonRequest({
        uid: 'user1', fullName: 'Alice', email: 'alice@test.com',
        role: 'pitcher', slug: 'alice', pitch: 'My cause', donation: 50,
      }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      expect(mockSet).toHaveBeenCalledTimes(2);

      // Pitcher profile — isSetUp: true, has pitch and donation
      const pitcherData = mockSet.mock.calls[0][1];
      expect(pitcherData.fullName).toBe('Alice');
      expect(pitcherData.email).toBe('alice@test.com');
      expect(pitcherData.pitch).toBe('My cause');
      expect(pitcherData.donation).toBe(50);
      expect(pitcherData.credit_balance).toBe(0);
      expect(pitcherData.isSetUp).toBe(true);

      // Listener stub — isSetUp: false
      const listenerData = mockSet.mock.calls[1][1];
      expect(listenerData.fullName).toBe('Alice');
      expect(listenerData.isSetUp).toBe(false);
      expect(listenerData.donation).toBe(0);
    });

    it('commits the batch', async () => {
      await POST(createJsonRequest({
        uid: 'user1', fullName: 'Alice', email: 'alice@test.com',
        role: 'pitcher', slug: 'alice',
      }));
      expect(mockCommit).toHaveBeenCalledOnce();
    });
  });

  describe('listener role', () => {
    it('creates both listener (isSetUp: true) and pitcher (isSetUp: false) profiles', async () => {
      const res = await POST(createJsonRequest({
        uid: 'user2', fullName: 'Bob', email: 'bob@test.com',
        role: 'listener', slug: 'bob', intro: 'Hello', donation: 30,
      }));
      expect(res.status).toBe(200);

      expect(mockSet).toHaveBeenCalledTimes(2);

      // Listener profile — isSetUp: true
      const listenerData = mockSet.mock.calls[0][1];
      expect(listenerData.fullName).toBe('Bob');
      expect(listenerData.intro).toBe('Hello');
      expect(listenerData.donation).toBe(30);
      expect(listenerData.isSetUp).toBe(true);

      // Pitcher stub — isSetUp: false
      const pitcherData = mockSet.mock.calls[1][1];
      expect(pitcherData.fullName).toBe('Bob');
      expect(pitcherData.isSetUp).toBe(false);
      expect(pitcherData.credit_balance).toBe(0);
    });
  });

  describe('both-stubs role', () => {
    it('creates both profiles with isSetUp: false', async () => {
      const res = await POST(createJsonRequest({
        uid: 'user3', fullName: 'Charlie', email: 'charlie@test.com',
        role: 'both-stubs',
      }));
      expect(res.status).toBe(200);

      expect(mockSet).toHaveBeenCalledTimes(2);

      const pitcherData = mockSet.mock.calls[0][1];
      expect(pitcherData.isSetUp).toBe(false);
      expect(pitcherData.donation).toBe(0);

      const listenerData = mockSet.mock.calls[1][1];
      expect(listenerData.isSetUp).toBe(false);
      expect(listenerData.donation).toBe(0);
    });

    it('generates slug when not provided', async () => {
      await POST(createJsonRequest({
        uid: 'user3', fullName: 'Charlie Brown', email: 'charlie@test.com',
        role: 'both-stubs',
      }));

      const pitcherData = mockSet.mock.calls[0][1];
      expect(pitcherData.slug).toBe('charliebrown');
    });

    it('uses provided slug when given', async () => {
      await POST(createJsonRequest({
        uid: 'user3', fullName: 'Charlie', email: 'charlie@test.com',
        role: 'both-stubs', slug: 'custom-slug',
      }));

      const pitcherData = mockSet.mock.calls[0][1];
      expect(pitcherData.slug).toBe('custom-slug');
    });
  });

  describe('donation parsing', () => {
    it('parses string donation to number', async () => {
      await POST(createJsonRequest({
        uid: 'user1', fullName: 'Alice', email: 'alice@test.com',
        role: 'pitcher', slug: 'alice', donation: '25.50',
      }));

      const pitcherData = mockSet.mock.calls[0][1];
      expect(pitcherData.donation).toBe(25.5);
    });

    it('defaults to 0 for invalid donation', async () => {
      await POST(createJsonRequest({
        uid: 'user1', fullName: 'Alice', email: 'alice@test.com',
        role: 'pitcher', slug: 'alice', donation: 'invalid',
      }));

      const pitcherData = mockSet.mock.calls[0][1];
      expect(pitcherData.donation).toBe(0);
    });
  });

  describe('error handling', () => {
    it('returns 500 when batch commit fails', async () => {
      mockCommit.mockRejectedValue(new Error('Firestore error'));
      const res = await POST(createJsonRequest({
        uid: 'user1', fullName: 'Alice', email: 'alice@test.com',
        role: 'pitcher', slug: 'alice',
      }));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.message).toContain('Failed to create profiles');
    });
  });
});
