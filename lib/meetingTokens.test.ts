import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateToken, hashToken, verifyToken } from './meetingTokens';

const TEST_SECRET = 'a'.repeat(64);
let originalSecret: string | undefined;

beforeEach(() => {
  originalSecret = process.env.MEETING_TOKEN_SECRET;
  process.env.MEETING_TOKEN_SECRET = TEST_SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.MEETING_TOKEN_SECRET;
  } else {
    process.env.MEETING_TOKEN_SECRET = originalSecret;
  }
});

describe('generateToken', () => {
  it('returns a raw token and a hash', () => {
    const { raw, hash } = generateToken();
    expect(raw).toBeTruthy();
    expect(hash).toBeTruthy();
    expect(raw).not.toBe(hash);
  });

  it('generates different tokens each call', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1.raw).not.toBe(t2.raw);
    expect(t1.hash).not.toBe(t2.hash);
  });

  it('produces base64url-safe characters only', () => {
    const { raw, hash } = generateToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('throws when MEETING_TOKEN_SECRET is unset', () => {
    delete process.env.MEETING_TOKEN_SECRET;
    expect(() => generateToken()).toThrow(/MEETING_TOKEN_SECRET/);
  });

  it('throws when MEETING_TOKEN_SECRET is too short', () => {
    process.env.MEETING_TOKEN_SECRET = 'short';
    expect(() => generateToken()).toThrow(/MEETING_TOKEN_SECRET/);
  });
});

describe('verifyToken', () => {
  it('returns true for the matching raw + hash', () => {
    const { raw, hash } = generateToken();
    expect(verifyToken(raw, hash)).toBe(true);
  });

  it('returns false for a tampered raw token', () => {
    const { hash } = generateToken();
    expect(verifyToken('not-the-original-token', hash)).toBe(false);
  });

  it('returns false for a tampered hash', () => {
    const { raw } = generateToken();
    expect(verifyToken(raw, 'wrong-hash')).toBe(false);
  });

  it('returns false for empty raw', () => {
    const { hash } = generateToken();
    expect(verifyToken('', hash)).toBe(false);
  });

  it('returns false for empty hash', () => {
    const { raw } = generateToken();
    expect(verifyToken(raw, '')).toBe(false);
  });

  it('returns false when secret is missing at verification time', () => {
    const { raw, hash } = generateToken();
    delete process.env.MEETING_TOKEN_SECRET;
    expect(verifyToken(raw, hash)).toBe(false);
  });

  it('rejects tokens generated under a different secret', () => {
    const { raw, hash } = generateToken();
    process.env.MEETING_TOKEN_SECRET = 'b'.repeat(64);
    expect(verifyToken(raw, hash)).toBe(false);
  });
});

describe('hashToken', () => {
  it('is deterministic with the same secret', () => {
    const h1 = hashToken('the-token');
    const h2 = hashToken('the-token');
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different secrets', () => {
    const h1 = hashToken('the-token', 'a'.repeat(64));
    const h2 = hashToken('the-token', 'b'.repeat(64));
    expect(h1).not.toBe(h2);
  });
});
