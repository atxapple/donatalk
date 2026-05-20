import { adminDb } from '@/lib/firebaseAdmin';
import { verifyToken } from '@/lib/meetingTokens';
import { RESERVATION_TTL_DAYS } from '@/lib/constants';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const TTL_MS = RESERVATION_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Auth modes for accept/decline:
 *  - 'token': email-link click; the URL token is the proof of ownership.
 *  - 'owner': in-app action by a Firebase-authenticated user; their uid must
 *             match the page-owner side of the meeting (listener for `reserved`,
 *             pitcher for `pending`).
 */
export type ActionAuth =
  | { mode: 'token'; rawToken: string }
  | { mode: 'owner'; uid: string };

export type AcceptResult =
  | { kind: 'not-found' }
  | { kind: 'invalid-auth' }
  | { kind: 'token-used' }
  | { kind: 'terminal-state'; status: string }
  | { kind: 'expired' }
  | { kind: 'pitcher-gone' }
  | { kind: 'insufficient-balance'; available: number; required: number }
  | {
      kind: 'accepted';
      amount: number;
      pitcherName: string;
      pitcherEmail: string;
      listenerName: string;
      listenerEmail: string;
    };

export type DeclineResult =
  | { kind: 'not-found' }
  | { kind: 'invalid-auth' }
  | { kind: 'token-used' }
  | { kind: 'terminal-state'; status: string }
  | {
      kind: 'declined';
      wasReserved: boolean;
      amount: number;
      visitorRole: 'pitcher' | 'listener';
      recipientName: string;
      recipientEmail: string;
      otherPartyName: string;
    };

type MeetingDoc = {
  status: string;
  tokenUsed?: boolean;
  acceptTokenHash?: string;
  reservedAt?: Timestamp;
  reservedAmount?: number;
  pitcherId?: string;
  pitcherName?: string;
  pitcherEmail?: string;
  listenerId?: string;
  listenerName?: string;
  listenerEmail?: string;
};

function verifyAuth(meeting: MeetingDoc, auth: ActionAuth): boolean {
  if (auth.mode === 'token') {
    if (meeting.tokenUsed) return false;
    return verifyToken(auth.rawToken, meeting.acceptTokenHash || '');
  }
  // 'owner' mode: caller's uid must match the page-owner side of this meeting.
  if (meeting.status === 'reserved') return auth.uid === meeting.listenerId;
  if (meeting.status === 'pending') return auth.uid === meeting.pitcherId;
  return false;
}

export async function acceptMeeting(meetingId: string, auth: ActionAuth): Promise<AcceptResult> {
  const meetingRef = adminDb.collection('meetings').doc(meetingId);
  return adminDb.runTransaction(async (tx) => {
    const meetingSnap = await tx.get(meetingRef);
    if (!meetingSnap.exists) return { kind: 'not-found' as const };
    const meeting = meetingSnap.data() as MeetingDoc;

    if (!['reserved', 'pending'].includes(meeting.status)) {
      return { kind: 'terminal-state' as const, status: meeting.status };
    }
    if (auth.mode === 'token' && meeting.tokenUsed) {
      return { kind: 'token-used' as const };
    }
    if (!verifyAuth(meeting, auth)) {
      return { kind: 'invalid-auth' as const };
    }

    // Expiry check
    const reservedAt = meeting.reservedAt;
    const ageMs = reservedAt ? Date.now() - reservedAt.toMillis() : 0;
    if (reservedAt && ageMs > TTL_MS) {
      if (meeting.status === 'reserved' && meeting.pitcherId) {
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

    if (!meeting.pitcherId) return { kind: 'not-found' as const };
    const pitcherRef = adminDb.collection('pitchers').doc(meeting.pitcherId);
    const pitcherSnap = await tx.get(pitcherRef);
    if (!pitcherSnap.exists) return { kind: 'pitcher-gone' as const };
    const pitcher = pitcherSnap.data()!;
    if (pitcher.deletedAt) {
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
      tx.update(pitcherRef, {
        credit_balance: FieldValue.increment(-amount),
        reservedBalance: FieldValue.increment(-amount),
        pendingReservationCount: FieldValue.increment(-1),
      });
    } else {
      // 'pending' — pitcher accepting on their own pitcher page. Re-check balance.
      const creditBalance = Number(pitcher.credit_balance) || 0;
      const reservedBalance = Number(pitcher.reservedBalance) || 0;
      const available = creditBalance - reservedBalance;
      if (available < amount) {
        return { kind: 'insufficient-balance' as const, available, required: amount };
      }
      tx.update(pitcherRef, {
        credit_balance: FieldValue.increment(-amount),
      });
    }

    const fhRef = adminDb.collection('fund_history').doc();
    tx.set(fhRef, {
      amount,
      eventType: 'meeting_commit',
      pitcherId: meeting.pitcherId,
      listenerId: meeting.listenerId,
      meetingId,
      timestamp: Timestamp.now(),
    });
    const now = Timestamp.now();
    tx.update(meetingRef, {
      status: 'accepted',
      tokenUsed: true,
      respondedAt: now,
      // Escrow tracking: the money is committed-but-not-yet-fulfilled. Either
      // party can confirm the meeting happened (→ completed) or report a
      // no-show (→ refunded). Auto-refund after ESCROW_TIMEOUT_DAYS.
      acceptedAt: now,
      escrowedAmount: amount,
      pitcherConfirmed: false,
      listenerConfirmed: false,
    });
    return {
      kind: 'accepted' as const,
      amount,
      pitcherName: meeting.pitcherName || '',
      pitcherEmail: meeting.pitcherEmail || '',
      listenerName: meeting.listenerName || '',
      listenerEmail: meeting.listenerEmail || '',
    };
  });
}

export async function declineMeeting(meetingId: string, auth: ActionAuth): Promise<DeclineResult> {
  const meetingRef = adminDb.collection('meetings').doc(meetingId);
  return adminDb.runTransaction(async (tx) => {
    const meetingSnap = await tx.get(meetingRef);
    if (!meetingSnap.exists) return { kind: 'not-found' as const };
    const meeting = meetingSnap.data() as MeetingDoc;

    if (!['reserved', 'pending'].includes(meeting.status)) {
      return { kind: 'terminal-state' as const, status: meeting.status };
    }
    if (auth.mode === 'token' && meeting.tokenUsed) {
      return { kind: 'token-used' as const };
    }
    if (!verifyAuth(meeting, auth)) {
      return { kind: 'invalid-auth' as const };
    }

    const wasReserved = meeting.status === 'reserved';
    const amount = Number(meeting.reservedAmount || 0);

    if (wasReserved && meeting.pitcherId) {
      const pitcherRef = adminDb.collection('pitchers').doc(meeting.pitcherId);
      tx.update(pitcherRef, {
        reservedBalance: FieldValue.increment(-amount),
        pendingReservationCount: FieldValue.increment(-1),
      });
    }
    tx.update(meetingRef, {
      status: 'declined',
      tokenUsed: true,
      respondedAt: Timestamp.now(),
    });

    return {
      kind: 'declined' as const,
      wasReserved,
      amount,
      visitorRole: wasReserved ? ('pitcher' as const) : ('listener' as const),
      recipientName: (wasReserved ? meeting.pitcherName : meeting.listenerName) || '',
      recipientEmail: (wasReserved ? meeting.pitcherEmail : meeting.listenerEmail) || '',
      otherPartyName: (wasReserved ? meeting.listenerName : meeting.pitcherName) || '',
    };
  });
}
