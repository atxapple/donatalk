import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';
import { refundMeeting } from '@/lib/meetingCompletion';
import { sendRefundEmail } from '@/lib/meetingEmails';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await verifyUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const callerUid = authResult.uid;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing meeting id' }, { status: 400 });

  try {
    const result = await refundMeeting(id, callerUid);
    switch (result.kind) {
      case 'not-found':
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      case 'invalid-auth':
        return NextResponse.json({ error: 'Not authorized for this meeting' }, { status: 403 });
      case 'wrong-state':
        return NextResponse.json({ error: `Meeting is ${result.status}, not accepted`, status: result.status }, { status: 409 });
      case 'refunded': {
        // Fire-and-forget — notify both parties of the refund.
        await Promise.all([
          sendRefundEmail({
            recipientName: result.pitcherName || 'there',
            recipientEmail: result.pitcherEmail || '',
            otherPartyName: result.listenerName || 'your listener',
            amount: result.amount,
            reason: result.reason,
            recipientRole: 'pitcher',
          }).catch((e) => console.error('[Refund Email Pitcher Failed]', e)),
          sendRefundEmail({
            recipientName: result.listenerName || 'there',
            recipientEmail: result.listenerEmail || '',
            otherPartyName: result.pitcherName || 'your pitcher',
            amount: result.amount,
            reason: result.reason,
            recipientRole: 'listener',
          }).catch((e) => console.error('[Refund Email Listener Failed]', e)),
        ]);
        return NextResponse.json({
          ok: true,
          status: 'refunded',
          refundedAmount: result.amount,
          reason: result.reason,
        });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Report No-Show Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
