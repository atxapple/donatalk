// Firebase Auth UIDs are 20+ alphanumeric characters. The min-length constraint
// also excludes app-internal routes like /pitcher/profile, /pitcher/signup, etc.
const RETURN_PATH_PATTERN = /^\/(?:listener|pitcher)\/[A-Za-z0-9_-]{20,128}(?:\?[A-Za-z0-9=&_-]*)?$/;

export function getSafeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.length > 256) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  if (!decoded.startsWith('/')) return null;
  if (decoded.startsWith('//')) return null;
  if (decoded.includes('\\')) return null;
  if (!RETURN_PATH_PATTERN.test(decoded)) return null;

  return decoded;
}
