import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyToken } from '@/lib/meetingTokens';
import { sendAcceptConfirmationEmail } from '@/lib/meetingEmails';
import { RESERVATION_TTL_DAYS } from '@/lib/constants';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const TTL_MS = RESERVATION_TTL_DAYS * 24 * 60 * 60 * 1000;

type RouteContext = { params: Promise<{ id: string }> };

function htmlPage(title: string, body: string, color = '#2C3E50'): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} | DonaTalk</title></head>
<body style="font-family:Arial,sans-serif;background:#f7f7f7;margin:0;padding:40px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;text-align:center;">
    <h1 style="color:${color};margin-top:0;">${title}</h1>
    ${body}
    <p style="margin-top:30px;"><a href="https://donatalk.com" style="color:${color};">Back to DonaTalk</a></p>
  </div>
</body></html>`;
}

function htmlResponse(status: number, html: string): Response {
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const rawToken = url.searchParams.get('token');

  if (!id || !rawToken) {
    return htmlResponse(400, htmlPage('Invalid Link', '<p>This link is missing required information.</p>', '#c0392b'));
  }

  try {
    const meetingRef = adminDb.collection('meetings').doc(id);

    const result = await adminDb.runTransaction(async (tx) => {
      const meetingSnap = await tx.get(meetingRef);
      if (!meetingSnap.exists) {
        return { kind: 'not-found' as const };
      }
      const meeting = meetingSnap.data()!;

      if (!['reserved', 'pending'].includes(meeting.status)) {
        return { kind: 'terminal-state' as const, status: meeting.status, respondedAt: meeting.respondedAt };
      }
      if (meeting.tokenUsed) {
        return { kind: 'token-used' as const };
      }
      if (!verifyToken(rawToken, meeting.acceptTokenHash || '')) {
        return { kind: 'invalid-token' as const };
      }

      // Expiry check
      const reservedAt: Timestamp = meeting.reservedAt;
      const ageMs = Date.now() - reservedAt.toMillis();
      if (ageMs > TTL_MS) {
        // Flip to expired and release reservation if applicable
        if (meeting.status === 'reserved') {
          const pitcherRef = adminDb.collection('pitchers').doc(meeting.pitcherId);
          tx.update(pitcherRef, {
            reservedBalance: FieldValue.increment(-Number(meeting.reservedAmount || 0)),
            pendingReservationCount: FieldValue.increment(-1),
          });
        }
        tx.update(meetingRef, {
          status: 'expired',
          tokenUsed: true,
          respondedAt: Timestamp.now(),
        });
        return { kind: 'expired' as const };
      }

      // Verify pitcher is still active
      const pitcherRef = adminDb.collection('pitchers').doc(meeting.pitcherId);
      const pitcherSnap = await tx.get(pitcherRef);
      if (!pitcherSnap.exists) {
        return { kind: 'pitcher-gone' as const };
      }
      const pitcher = pitcherSnap.data()!;
      if (pitcher.deletedAt) {
        // Pitcher soft-deleted; release reservation if any, mark cancelled.
        if (meeting.status === 'reserved') {
          tx.update(pitcherRef, {
            reservedBalance: FieldValue.increment(-Number(meeting.reservedAmount || 0)),
            pendingReservationCount: FieldValue.increment(-1),
          });
        }
        tx.update(meetingRef, {
          status: 'cancelled',
          cancelReason: 'pitcher-deleted',
          tokenUsed: true,
          respondedAt: Timestamp.now(),
        });
        return { kind: 'pitcher-gone' as const };
      }

      const amount = Number(meeting.reservedAmount || 0);

      if (meeting.status === 'reserved') {
        // Pitcher already reserved their balance. Commit: deduct from credit_balance,
        // release from reservedBalance, log fund_history.
        tx.update(pitcherRef, {
          credit_balance: FieldValue.increment(-amount),
          reservedBalance: FieldValue.increment(-amount),
          pendingReservationCount: FieldValue.increment(-1),
        });
        const fhRef = adminDb.collection('fund_history').doc();
        tx.set(fhRef, {
          amount,
          eventType: 'meeting_commit',
          pitcherId: meeting.pitcherId,
          listenerId: meeting.listenerId,
          meetingId: id,
          timestamp: Timestamp.now(),
        });
        tx.update(meetingRef, {
          status: 'accepted',
          tokenUsed: true,
          respondedAt: Timestamp.now(),
        });
        return {
          kind: 'accepted' as const,
          amount,
          pitcherName: meeting.pitcherName,
          pitcherEmail: meeting.pitcherEmail,
          listenerName: meeting.listenerName,
          listenerEmail: meeting.listenerEmail,
        };
      }

      // status === 'pending' — pitcher accepting on their own pitcher page.
      // Check balance now (could have changed since request was sent).
      const creditBalance = Number(pitcher.credit_balance) || 0;
      const reservedBalance = Number(pitcher.reservedBalance) || 0;
      const available = creditBalance - reservedBalance;
      if (available < amount) {
        return { kind: 'insufficient-balance' as const, available, required: amount };
      }
      tx.update(pitcherRef, {
        credit_balance: FieldValue.increment(-amount),
      });
      const fhRef = adminDb.collection('fund_history').doc();
      tx.set(fhRef, {
        amount,
        eventType: 'meeting_commit',
        pitcherId: meeting.pitcherId,
        listenerId: meeting.listenerId,
        meetingId: id,
        timestamp: Timestamp.now(),
      });
      tx.update(meetingRef, {
        status: 'accepted',
        tokenUsed: true,
        respondedAt: Timestamp.now(),
      });
      return {
        kind: 'accepted' as const,
        amount,
        pitcherName: meeting.pitcherName,
        pitcherEmail: meeting.pitcherEmail,
        listenerName: meeting.listenerName,
        listenerEmail: meeting.listenerEmail,
      };
    });

    switch (result.kind) {
      case 'not-found':
        return htmlResponse(404, htmlPage('Meeting not found', '<p>This meeting does not exist or has been removed.</p>', '#c0392b'));
      case 'invalid-token':
        return htmlResponse(403, htmlPage('Invalid Link', '<p>The token in this link is invalid.</p>', '#c0392b'));
      case 'token-used':
        return htmlResponse(200, htmlPage('Already Used', '<p>This link has already been used.</p>'));
      case 'terminal-state':
        return htmlResponse(200, htmlPage(`Already ${result.status}`, `<p>This meeting was already ${result.status}.</p>`));
      case 'expired':
        return htmlResponse(200, htmlPage('Link expired', `<p>This meeting request expired after ${RESERVATION_TTL_DAYS} days. The reservation has been released.</p>`, '#888'));
      case 'pitcher-gone':
        return htmlResponse(200, htmlPage('Pitcher unavailable', '<p>This pitcher is no longer active. The reservation has been released.</p>', '#888'));
      case 'insufficient-balance':
        return htmlResponse(409, htmlPage(
          'Pitcher balance no longer sufficient',
          `<p>The pitcher's available balance ($${result.available.toFixed(2)}) is below the required $${result.required.toFixed(2)}. They may have spent it elsewhere — they'll need to add funds before this can be accepted.</p>`,
          '#c0392b',
        ));
      case 'accepted': {
        // Fire-and-forget confirmation emails to both parties.
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
        return htmlResponse(200, htmlPage(
          '✓ Meeting confirmed',
          `<p>The donation of <strong>$${result.amount.toFixed(2)}</strong> has been committed. Check your email for the meeting link.</p>`,
          '#27ae60',
        ));
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Meeting Accept Error]', message);
    return htmlResponse(500, htmlPage('Error', '<p>Something went wrong. Please contact support@donatalk.com</p>', '#c0392b'));
  }
}
