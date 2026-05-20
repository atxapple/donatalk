import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';
import { acceptMeeting, declineMeeting } from '@/lib/meetingActions';
import { sendAcceptConfirmationEmail, sendDeclineNoticeToVisitor } from '@/lib/meetingEmails';

type RouteContext = { params: Promise<{ id: string }> };

type Body = { action?: 'accept' | 'decline' };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await verifyUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const callerUid = authResult.uid;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing meeting id' }, { status: 400 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action;
  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
  }

  try {
    if (action === 'accept') {
      const result = await acceptMeeting(id, { mode: 'owner', uid: callerUid });
      switch (result.kind) {
        case 'not-found':
          return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        case 'invalid-auth':
          return NextResponse.json({ error: 'Not authorized to act on this meeting' }, { status: 403 });
        case 'terminal-state':
          return NextResponse.json({ error: `Meeting already ${result.status}`, status: result.status }, { status: 409 });
        case 'expired':
          return NextResponse.json({ error: 'Reservation expired and was released' }, { status: 410 });
        case 'pitcher-gone':
          return NextResponse.json({ error: 'Pitcher is no longer active; reservation released' }, { status: 410 });
        case 'insufficient-balance':
          return NextResponse.json({
            error: 'pitcher-balance-insufficient',
            available: result.available,
            required: result.required,
          }, { status: 409 });
        case 'token-used':
          // Possible in owner mode only if a token was previously claimed but the
          // tx didn't advance status. Treat as a non-error stale lock.
          return NextResponse.json({ error: 'Conflict — please refresh' }, { status: 409 });
        case 'accepted': {
          const sends = [
            sendAcceptConfirmationEmail({
              recipientName: result.pitcherName || 'there',
              recipientEmail: result.pitcherEmail || '',
              otherPartyName: result.listenerName || 'your listener',
              amount: result.amount,
            }).catch((e) => console.error('[Accept Email Pitcher Failed]', e)),
            sendAcceptConfirmationEmail({
              recipientName: result.listenerName || 'there',
              recipientEmail: result.listenerEmail || '',
              otherPartyName: result.pitcherName || 'your pitcher',
              amount: result.amount,
            }).catch((e) => console.error('[Accept Email Listener Failed]', e)),
          ];
          await Promise.all(sends);
          return NextResponse.json({ ok: true, action: 'accepted', amount: result.amount });
        }
      }
    } else {
      const result = await declineMeeting(id, { mode: 'owner', uid: callerUid });
      switch (result.kind) {
        case 'not-found':
          return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        case 'invalid-auth':
          return NextResponse.json({ error: 'Not authorized to act on this meeting' }, { status: 403 });
        case 'terminal-state':
          return NextResponse.json({ error: `Meeting already ${result.status}`, status: result.status }, { status: 409 });
        case 'token-used':
          return NextResponse.json({ error: 'Conflict — please refresh' }, { status: 409 });
        case 'declined': {
          try {
            await sendDeclineNoticeToVisitor({
              recipientName: result.recipientName || 'there',
              recipientEmail: result.recipientEmail || '',
              otherPartyName: result.otherPartyName || 'the other party',
              amountReleased: result.wasReserved ? result.amount : null,
            });
          } catch (e) {
            console.error('[Decline Notice Failed]', e);
          }
          return NextResponse.json({
            ok: true,
            action: 'declined',
            releasedAmount: result.wasReserved ? result.amount : 0,
          });
        }
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Meeting Respond Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
