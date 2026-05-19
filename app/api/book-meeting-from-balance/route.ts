import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyUser } from '@/lib/verifyUser';
import { calculateTotalWithFee } from '@/lib/constants';
import { generateToken } from '@/lib/meetingTokens';
import { sendReservationEmailToListener } from '@/lib/meetingEmails';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const MAX_PENDING_RESERVATIONS = 5;

type Body = {
  listenerId?: string;
  availability?: string;
  idempotencyKey?: string;
};

export async function POST(req: Request) {
  const authResult = await verifyUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const pitcherUid = authResult.uid;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { listenerId, availability, idempotencyKey } = body;
  if (!listenerId || !availability || !idempotencyKey) {
    return NextResponse.json(
      { error: 'Missing listenerId, availability, or idempotencyKey' },
      { status: 400 },
    );
  }
  if (pitcherUid === listenerId) {
    return NextResponse.json({ error: 'Cannot book a meeting with yourself' }, { status: 400 });
  }

  try {
    // Idempotency replay — short-circuit if this client already submitted
    const existingSnap = await adminDb
      .collection('meetings')
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      const doc = existingSnap.docs[0];
      const data = doc.data();
      return NextResponse.json({
        meetingId: doc.id,
        status: data.status,
        reservedAmount: data.reservedAmount,
        idempotentReplay: true,
      });
    }

    const pitcherRef = adminDb.collection('pitchers').doc(pitcherUid);
    const listenerRef = adminDb.collection('listeners').doc(listenerId);

    const txResult = await adminDb.runTransaction(async (tx) => {
      const pitcherSnap = await tx.get(pitcherRef);
      const listenerSnap = await tx.get(listenerRef);

      if (!pitcherSnap.exists) return { error: { status: 403, message: 'Pitcher profile not found' } };
      if (!listenerSnap.exists) return { error: { status: 404, message: 'Listener not found' } };

      const pitcher = pitcherSnap.data()!;
      const listener = listenerSnap.data()!;

      if (pitcher.isSetUp === false) return { error: { status: 403, message: 'Pitcher profile not set up' } };
      if (pitcher.deletedAt) return { error: { status: 403, message: 'Pitcher profile is no longer active' } };
      if (listener.isSetUp === false) return { error: { status: 404, message: 'Listener profile is not available' } };
      if (listener.deletedAt) return { error: { status: 404, message: 'Listener profile is no longer available' } };

      const pendingCount: number = pitcher.pendingReservationCount || 0;
      if (pendingCount >= MAX_PENDING_RESERVATIONS) {
        return {
          error: {
            status: 429,
            message: `You have ${MAX_PENDING_RESERVATIONS} pending pitches awaiting listener response. Cancel one before sending another.`,
          },
        };
      }

      const reservedAmount = calculateTotalWithFee(Number(listener.donation) || 0);
      const creditBalance = Number(pitcher.credit_balance) || 0;
      const reservedBalance = Number(pitcher.reservedBalance) || 0;
      const available = creditBalance - reservedBalance;

      if (available < reservedAmount) {
        return {
          error: {
            status: 409,
            code: 'insufficient-balance',
            message: 'Insufficient available balance',
            available,
            required: reservedAmount,
          },
        };
      }

      const { raw, hash } = generateToken();
      const now = Timestamp.now();

      const meetingRef = adminDb.collection('meetings').doc();
      tx.set(meetingRef, {
        meetingsource: 'listenerPage',
        pitcherId: pitcherUid,
        pitcherName: pitcher.fullName || '',
        pitcherEmail: pitcher.email || '',
        listenerId,
        listenerName: listener.fullName || '',
        listenerEmail: listener.email || '',
        availability,
        donation: Number(listener.donation) || 0,
        reservedAmount,
        paymentSource: 'pitcher-balance',
        status: 'reserved',
        acceptTokenHash: hash,
        tokenUsed: false,
        idempotencyKey,
        reservedAt: now,
        respondedAt: null,
        createdAt: now,
      });

      tx.update(pitcherRef, {
        reservedBalance: FieldValue.increment(reservedAmount),
        pendingReservationCount: FieldValue.increment(1),
      });

      return {
        ok: {
          meetingId: meetingRef.id,
          rawToken: raw,
          reservedAmount,
          pitcherName: pitcher.fullName || '',
          listenerName: listener.fullName || '',
          listenerEmail: listener.email || '',
          donationAmount: Number(listener.donation) || 0,
          availability,
        },
      };
    });

    if ('error' in txResult && txResult.error) {
      const e = txResult.error;
      return NextResponse.json(
        { error: e.message, code: e.code, available: e.available, required: e.required },
        { status: e.status },
      );
    }
    if (!('ok' in txResult) || !txResult.ok) {
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    const ok = txResult.ok;
    try {
      await sendReservationEmailToListener({
        meetingId: ok.meetingId,
        rawToken: ok.rawToken,
        pitcherName: ok.pitcherName,
        listenerName: ok.listenerName,
        listenerEmail: ok.listenerEmail,
        amount: ok.reservedAmount,
        availability: ok.availability,
        donationAmount: ok.donationAmount,
      });
    } catch (emailErr) {
      console.error('[Reservation Email Failed]', emailErr);
    }

    return NextResponse.json({
      meetingId: ok.meetingId,
      status: 'reserved',
      reservedAmount: ok.reservedAmount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Book Meeting From Balance Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
