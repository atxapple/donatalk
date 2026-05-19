import { describe, it, expect } from 'vitest';
import { getSafeReturnPath } from './safeReturn';

describe('getSafeReturnPath', () => {
  // Realistic Firebase Auth UID (28 alphanumeric chars, matches the sample
  // app.donatalk.com/listener/ASrRQKr2g8NRBsAGOQAUZ7txzXi2 in the wild)
  const REAL_UID = 'ASrRQKr2g8NRBsAGOQAUZ7txzXi2';
  const ALT_UID = 'XyZ1234567abcdefghIJKLmnopQR';

  describe('accepted paths', () => {
    it('accepts /listener/{uid}', () => {
      expect(getSafeReturnPath(`/listener/${REAL_UID}`)).toBe(`/listener/${REAL_UID}`);
    });

    it('accepts /pitcher/{uid}', () => {
      expect(getSafeReturnPath(`/pitcher/${ALT_UID}`)).toBe(`/pitcher/${ALT_UID}`);
    });

    it('accepts uid with underscores and dashes', () => {
      const uid = 'abc_123-xyz' + '0'.repeat(10);
      expect(getSafeReturnPath(`/listener/${uid}`)).toBe(`/listener/${uid}`);
    });

    it('accepts URL-encoded valid path', () => {
      expect(getSafeReturnPath(`%2Flistener%2F${REAL_UID}`)).toBe(`/listener/${REAL_UID}`);
    });

    it('accepts path with simple query string', () => {
      expect(getSafeReturnPath(`/listener/${REAL_UID}?ref=email`)).toBe(`/listener/${REAL_UID}?ref=email`);
    });
  });

  describe('rejected — null/empty input', () => {
    it('rejects null', () => {
      expect(getSafeReturnPath(null)).toBeNull();
    });

    it('rejects undefined', () => {
      expect(getSafeReturnPath(undefined)).toBeNull();
    });

    it('rejects empty string', () => {
      expect(getSafeReturnPath('')).toBeNull();
    });
  });

  describe('rejected — open-redirect threats', () => {
    it('rejects absolute URL', () => {
      expect(getSafeReturnPath('https://evil.com')).toBeNull();
    });

    it('rejects http URL', () => {
      expect(getSafeReturnPath('http://evil.com')).toBeNull();
    });

    it('rejects protocol-relative URL', () => {
      expect(getSafeReturnPath('//evil.com')).toBeNull();
    });

    it('rejects javascript scheme', () => {
      expect(getSafeReturnPath('javascript:alert(1)')).toBeNull();
    });

    it('rejects data scheme', () => {
      expect(getSafeReturnPath('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('rejects backslash path tricks', () => {
      expect(getSafeReturnPath('/\\evil.com')).toBeNull();
    });

    it('rejects URL-encoded protocol-relative', () => {
      expect(getSafeReturnPath('%2F%2Fevil.com')).toBeNull();
    });

    it('rejects chained return target /login', () => {
      expect(getSafeReturnPath('/login?return=//evil.com')).toBeNull();
    });

    it('rejects admin route', () => {
      expect(getSafeReturnPath('/admin')).toBeNull();
    });

    it('rejects /pitcher/profile (uid too short, matches app route)', () => {
      expect(getSafeReturnPath('/pitcher/profile')).toBeNull();
    });

    it('rejects /pitcher/signup', () => {
      expect(getSafeReturnPath('/pitcher/signup')).toBeNull();
    });

    it('rejects /listener/update-profile', () => {
      expect(getSafeReturnPath('/listener/update-profile')).toBeNull();
    });

    it('rejects /pitcher/add-fund', () => {
      expect(getSafeReturnPath('/pitcher/add-fund')).toBeNull();
    });
  });

  describe('rejected — malformed input', () => {
    it('rejects path that does not start with /', () => {
      expect(getSafeReturnPath('listener/abc123')).toBeNull();
    });

    it('rejects path with uid containing invalid chars', () => {
      expect(getSafeReturnPath('/listener/abc/123')).toBeNull();
    });

    it('rejects path with uid containing slashes', () => {
      expect(getSafeReturnPath(`/listener/${REAL_UID}/extra`)).toBeNull();
    });

    it('rejects path with uid shorter than 20 chars', () => {
      expect(getSafeReturnPath('/listener/short')).toBeNull();
    });

    it('rejects path over 256 chars', () => {
      const longPath = '/listener/' + 'a'.repeat(260);
      expect(getSafeReturnPath(longPath)).toBeNull();
    });

    it('rejects path with malformed URI encoding', () => {
      expect(getSafeReturnPath('/listener/%ZZ')).toBeNull();
    });

    it('rejects empty uid', () => {
      expect(getSafeReturnPath('/listener/')).toBeNull();
    });
  });
});
