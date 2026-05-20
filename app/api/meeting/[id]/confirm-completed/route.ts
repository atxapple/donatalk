import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';
import { confirmMeetingCompleted } from '@/lib/meetingCompletion';
import { sendCompletionEmail } from '@/lib/meetingEmails';
import { adminDb } from '@/lib/firebaseAdmin';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await verifyUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const callerUid = authResult.uid;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing meeting id' }, { status: 400 });

  try {
    const result = await confirmMeetingCompleted(id, callerUid);
    switch (result.kind) {
      case 'not-found':
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      case 'invalid-auth':
        return NextResponse.json({ error: 'Not authorized for this meeting' }, { status: 403 });
      case 'wrong-state':
        return NextResponse.json({ error: `Meeting is ${result.status}, not accepted`, status: result.status }, { status: 409 });
      case 'already-confirmed':
        return NextResponse.json({ ok: true, alreadyConfirmed: true });
      case 'partial':
        return NextResponse.json({
          ok: true,
          status: 'accepted',
          pitcherConfirmed: result.pitcherConfirmed,
          listenerConfirmed: result.listenerConfirmed,
          waitingFor: result.pitcherConfirmed ? 'listener' : 'pitcher',
        });
      case 'completed': {
        // Fire-and-forget completion emails. Need the participant emails which
        // weren't returned from the helper — re-read the meeting doc for them.
        try {
          const snap = await adminDb.collection('meetings').doc(id).get();
          const m = snap.data();
          if (m) {
            await Promise.all([
              sendCompletionEmail({
                recipientName: m.pitcherName || 'there',
                recipientEmail: m.pitcherEmail || '',
                otherPartyName: m.listenerName || 'your listener',
                amount: result.amount,
                reason: 'mutual-confirm',
              }).catch((e) => console.error('[Completion Email Pitcher Failed]', e)),
              sendCompletionEmail({
                recipientName: m.listenerName || 'there',
                recipientEmail: m.listenerEmail || '',
                otherPartyName: m.pitcherName || 'your pitcher',
                amount: result.amount,
                reason: 'mutual-confirm',
              }).catch((e) => console.error('[Completion Email Listener Failed]', e)),
            ]);
          }
        } catch (e) {
          console.error('[Completion email lookup failed]', e);
        }
        return NextResponse.json({
          ok: true,
          status: 'completed',
          amount: result.amount,
        });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Confirm Completed Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
