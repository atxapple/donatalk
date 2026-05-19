import { createHash, randomBytes, timingSafeEqual } from 'crypto';

function getSecret(): string {
  const secret = process.env.MEETING_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('MEETING_TOKEN_SECRET env var is not set or too short (require >= 32 chars)');
  }
  return secret;
}

export function generateToken(): { raw: string; hash: string } {
  // Including the secret in the hashed material binds tokens to this deployment's
  // secret — rotating MEETING_TOKEN_SECRET invalidates all outstanding tokens.
  const secret = getSecret();
  const raw = randomBytes(32).toString('base64url');
  const hash = hashToken(raw, secret);
  return { raw, hash };
}

export function hashToken(raw: string, secretOverride?: string): string {
  const secret = secretOverride ?? getSecret();
  return createHash('sha256').update(secret).update(raw).digest('base64url');
}

export function verifyToken(raw: string, expectedHash: string): boolean {
  if (!raw || !expectedHash) return false;
  let computed: string;
  try {
    computed = hashToken(raw);
  } catch {
    return false;
  }
  const a = Buffer.from(computed);
  const b = Buffer.from(expectedHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
