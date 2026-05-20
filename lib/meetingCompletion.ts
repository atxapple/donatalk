import { adminDb } from '@/lib/firebaseAdmin';
import { ESCROW_TIMEOUT_DAYS } from '@/lib/constants';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const TIMEOUT_MS = ESCROW_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;

export type Role = 'pitcher' | 'listener';

export type CompletionReason = 'mutual-confirm' | 'timeout-no-complaints';

export type ConfirmCompletedResult =
  | { kind: 'not-found' }
  | { kind: 'invalid-auth' }
  | { kind: 'wrong-state'; status: string }
  | { kind: 'already-confirmed' }
  | { kind: 'partial'; pitcherConfirmed: boolean; listenerConfirmed: boolean }
  | {
      kind: 'completed';
      reason: CompletionReason;
      amount: number;
      pitcherName: string;
      listenerName: string;
    };

export type RefundResult =
  | { kind: 'not-found' }
  | { kind: 'invalid-auth' }
  | { kind: 'wrong-state'; status: string }
  | {
      kind: 'refunded';
      amount: number;
      reason: 'no-show-by-pitcher' | 'no-show-by-listener';
      pitcherName: string;
      pitcherEmail: string;
      listenerName: string;
      listenerEmail: string;
    };

type MeetingDoc = {
  status: string;
  pitcherId?: string;
  listenerId?: string;
  pitcherName?: string;
  pitcherEmail?: string;
  listenerName?: string;
  listenerEmail?: string;
  escrowedAmount?: number;
  reservedAmount?: number;
  acceptedAt?: Timestamp;
  pitcherConfirmed?: boolean;
  listenerConfirmed?: boolean;
};

function isParty(meeting: MeetingDoc, callerUid: string): Role | null {
  if (meeting.pitcherId === callerUid) return 'pitcher';
  if (meeting.listenerId === callerUid) return 'listener';
  return null;
}

function writeCompletion(
  tx: FirebaseFirestore.Transaction,
  meetingRef: FirebaseFirestore.DocumentReference,
  meeting: MeetingDoc,
  meetingId: string,
  reason: CompletionReason,
  now: Timestamp,
) {
  tx.update(meetingRef, {
    status: 'completed',
    completedAt: now,
    completionReason: reason,
  });
  // Audit marker — donation is now fulfilled (the actual transfer-to-nonprofit
  // step is out of scope of this app today; this row just closes the books).
  const fhRef = adminDb.collection('fund_history').doc();
  tx.set(fhRef, {
    amount: Number(meeting.escrowedAmount ?? meeting.reservedAmount ?? 0),
    eventType: 'meeting_fulfilled',
    pitcherId: meeting.pitcherId,
    listenerId: meeting.listenerId,
    meetingId,
    reason,
    timestamp: now,
  });
}

/**
 * Either party explicitly confirms the meeting happened. Once both confirm, the
 * meeting transitions to 'completed' immediately. Otherwise we just flip that
 * party's flag and wait for the other side (or for the 30-day timeout).
 */
export async function confirmMeetingCompleted(
  meetingId: string,
  callerUid: string,
): Promise<ConfirmCompletedResult> {
  const meetingRef = adminDb.collection('meetings').doc(meetingId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(meetingRef);
    if (!snap.exists) return { kind: 'not-found' as const };
    const meeting = snap.data() as MeetingDoc;

    if (meeting.status !== 'accepted') {
      return { kind: 'wrong-state' as const, status: meeting.status };
    }

    const role = isParty(meeting, callerUid);
    if (!role) return { kind: 'invalid-auth' as const };

    const alreadyConfirmed =
      role === 'pitcher' ? meeting.pitcherConfirmed : meeting.listenerConfirmed;
    if (alreadyConfirmed) return { kind: 'already-confirmed' as const };

    const pitcherConfirmedAfter = role === 'pitcher' ? true : !!meeting.pitcherConfirmed;
    const listenerConfirmedAfter = role === 'listener' ? true : !!meeting.listenerConfirmed;
    const bothConfirmed = pitcherConfirmedAfter && listenerConfirmedAfter;

    const now = Timestamp.now();
    tx.update(meetingRef, {
      pitcherConfirmed: pitcherConfirmedAfter,
      listenerConfirmed: listenerConfirmedAfter,
    });

    if (bothConfirmed) {
      writeCompletion(tx, meetingRef, meeting, meetingId, 'mutual-confirm', now);
      return {
        kind: 'completed' as const,
        reason: 'mutual-confirm' as const,
        amount: Number(meeting.escrowedAmount ?? meeting.reservedAmount ?? 0),
        pitcherName: meeting.pitcherName || '',
        listenerName: meeting.listenerName || '',
      };
    }

    return {
      kind: 'partial' as const,
      pitcherConfirmed: pitcherConfirmedAfter,
      listenerConfirmed: listenerConfirmedAfter,
    };
  });
}

/**
 * Auto-complete the meeting if it's been in 'accepted' state past the escrow
 * timeout with no complaints. The donation is treated as fulfilled — assume
 * the meeting happened unless someone actively reports a no-show.
 *
 * Returns `kind: 'no-action'` if the meeting isn't due for auto-completion;
 * caller should leave it alone.
 */
export async function autoCompleteIfExpired(
  meetingId: string,
): Promise<{ kind: 'no-action' | 'completed' | 'not-found' | 'wrong-state' }> {
  const meetingRef = adminDb.collection('meetings').doc(meetingId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(meetingRef);
    if (!snap.exists) return { kind: 'not-found' as const };
    const meeting = snap.data() as MeetingDoc;
    if (meeting.status !== 'accepted') return { kind: 'wrong-state' as const };
    if (!meeting.acceptedAt) return { kind: 'no-action' as const };
    if (Date.now() - meeting.acceptedAt.toMillis() <= TIMEOUT_MS) {
      return { kind: 'no-action' as const };
    }
    writeCompletion(tx, meetingRef, meeting, meetingId, 'timeout-no-complaints', Timestamp.now());
    return { kind: 'completed' as const };
  });
}

/**
 * Either party reports a no-show — immediate refund. Money returns to the
 * pitcher's credit_balance. Single-side trigger is intentional: no-shows are
 * usually clear-cut and forcing both-party-agreement creates a deadlock.
 */
export async function refundMeeting(
  meetingId: string,
  callerUid: string,
): Promise<RefundResult> {
  const meetingRef = adminDb.collection('meetings').doc(meetingId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(meetingRef);
    if (!snap.exists) return { kind: 'not-found' as const };
    const meeting = snap.data() as MeetingDoc;

    if (meeting.status !== 'accepted') {
      return { kind: 'wrong-state' as const, status: meeting.status };
    }

    const role = isParty(meeting, callerUid);
    if (!role) return { kind: 'invalid-auth' as const };

    const reason: 'no-show-by-pitcher' | 'no-show-by-listener' =
      role === 'pitcher' ? 'no-show-by-listener' : 'no-show-by-pitcher';

    const amount = Number(meeting.escrowedAmount ?? meeting.reservedAmount ?? 0);
    const now = Timestamp.now();

    if (meeting.pitcherId && amount > 0) {
      const pitcherRef = adminDb.collection('pitchers').doc(meeting.pitcherId);
      tx.update(pitcherRef, {
        credit_balance: FieldValue.increment(amount),
      });
    }

    const fhRef = adminDb.collection('fund_history').doc();
    tx.set(fhRef, {
      amount,
      eventType: 'meeting_refund',
      pitcherId: meeting.pitcherId,
      listenerId: meeting.listenerId,
      meetingId,
      reason,
      timestamp: now,
    });

    tx.update(meetingRef, {
      status: 'refunded',
      refundedAt: now,
      refundReason: reason,
    });

    return {
      kind: 'refunded' as const,
      amount,
      reason,
      pitcherName: meeting.pitcherName || '',
      pitcherEmail: meeting.pitcherEmail || '',
      listenerName: meeting.listenerName || '',
      listenerEmail: meeting.listenerEmail || '',
    };
  });
}

export function isEscrowExpired(acceptedAt: Timestamp | undefined | null): boolean {
  if (!acceptedAt) return false;
  return Date.now() - acceptedAt.toMillis() > TIMEOUT_MS;
}
