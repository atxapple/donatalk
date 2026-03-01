import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { isAdminEmail } from '@/lib/adminConfig';

export async function verifyAdmin(req: Request): Promise<{ email: string } | NextResponse> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (!isAdminEmail(decoded.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { email: decoded.email! };
}
