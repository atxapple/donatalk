import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyUser } from '@/lib/verifyUser';
import { sendCancellationNoticeToOwner } from '@/lib/meetingEmails';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await verifyUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const callerUid = authResult.uid;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing meeting id' }, { status: 400 });

  try {
    const meetingRef = adminDb.collection('meetings').doc(id);

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(meetingRef);
      if (!snap.exists) return { kind: 'not-found' as const };
      const meeting = snap.data()!;

      if (!['reserved', 'pending'].includes(meeting.status)) {
        return { kind: 'terminal' as const, status: meeting.status };
      }

      // Visitor side: reserved → pitcher submitted it; pending → listener submitted it.
      const visitorUid = meeting.status === 'reserved' ? meeting.pitcherId : meeting.listenerId;
      if (callerUid !== visitorUid) return { kind: 'forbidden' as const };

      const wasReserved = meeting.status === 'reserved';
      const amount = Number(meeting.reservedAmount || 0);
      const visitorRole = wasReserved ? ('pitcher' as const) : ('listener' as const);

      if (wasReserved) {
        const pitcherRef = adminDb.collection('pitchers').doc(meeting.pitcherId);
        tx.update(pitcherRef, {
          reservedBalance: FieldValue.increment(-amount),
          pendingReservationCount: FieldValue.increment(-1),
        });
      }
      tx.update(meetingRef, {
        status: 'cancelled',
        cancelReason: `${visitorRole}-cancel`,
        tokenUsed: true,
        respondedAt: Timestamp.now(),
      });

      return {
        kind: 'cancelled' as const,
        wasReserved,
        amount,
        visitorRole,
        ownerName: wasReserved ? meeting.listenerName : meeting.pitcherName,
        ownerEmail: wasReserved ? meeting.listenerEmail : meeting.pitcherEmail,
        visitorName: wasReserved ? meeting.pitcherName : meeting.listenerName,
      };
    });

    switch (result.kind) {
      case 'not-found':
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      case 'forbidden':
        return NextResponse.json({ error: 'Not authorized to cancel this meeting' }, { status: 403 });
      case 'terminal':
        return NextResponse.json({ error: `Meeting already ${result.status}` }, { status: 409 });
      case 'cancelled': {
        try {
          await sendCancellationNoticeToOwner({
            recipientName: result.ownerName || 'there',
            recipientEmail: result.ownerEmail || '',
            otherPartyName: result.visitorName || 'the other party',
            visitorRole: result.visitorRole,
          });
        } catch (e) {
          console.error('[Cancel Notice Failed]', e);
        }
        return NextResponse.json({
          cancelled: true,
          releasedAmount: result.wasReserved ? result.amount : 0,
        });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Meeting Cancel Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
