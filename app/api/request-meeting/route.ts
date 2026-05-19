import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyUser } from '@/lib/verifyUser';
import { calculateTotalWithFee } from '@/lib/constants';
import { generateToken } from '@/lib/meetingTokens';
import { sendPendingRequestEmailToPitcher } from '@/lib/meetingEmails';
import { Timestamp } from 'firebase-admin/firestore';

type Body = {
  pitcherId?: string;
  availability?: string;
  idempotencyKey?: string;
};

export async function POST(req: Request) {
  const authResult = await verifyUser(req);
  if (authResult instanceof NextResponse) return authResult;
  const listenerUid = authResult.uid;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { pitcherId, availability, idempotencyKey } = body;
  if (!pitcherId || !availability || !idempotencyKey) {
    return NextResponse.json(
      { error: 'Missing pitcherId, availability, or idempotencyKey' },
      { status: 400 },
    );
  }
  if (listenerUid === pitcherId) {
    return NextResponse.json({ error: 'Cannot request a meeting with yourself' }, { status: 400 });
  }

  try {
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

    const pitcherRef = adminDb.collection('pitchers').doc(pitcherId);
    const listenerRef = adminDb.collection('listeners').doc(listenerUid);

    const txResult = await adminDb.runTransaction(async (tx) => {
      const pitcherSnap = await tx.get(pitcherRef);
      const listenerSnap = await tx.get(listenerRef);

      if (!pitcherSnap.exists) return { error: { status: 404, message: 'Pitcher not found' } };
      if (!listenerSnap.exists) return { error: { status: 403, message: 'Listener profile not found' } };

      const pitcher = pitcherSnap.data()!;
      const listener = listenerSnap.data()!;

      if (pitcher.isSetUp === false) return { error: { status: 404, message: 'Pitcher profile not available' } };
      if (pitcher.deletedAt) return { error: { status: 404, message: 'Pitcher profile no longer available' } };
      if (listener.isSetUp === false) return { error: { status: 403, message: 'Listener profile not set up' } };
      if (listener.deletedAt) return { error: { status: 403, message: 'Listener profile is no longer active' } };

      const reservedAmount = calculateTotalWithFee(Number(pitcher.donation) || 0);
      const creditBalance = Number(pitcher.credit_balance) || 0;
      const reservedBalance = Number(pitcher.reservedBalance) || 0;
      const available = creditBalance - reservedBalance;

      if (available < reservedAmount) {
        return {
          error: {
            status: 409,
            code: 'pitcher-link-inactive',
            message: "This pitcher's link is not currently active",
          },
        };
      }

      const { raw, hash } = generateToken();
      const now = Timestamp.now();

      const meetingRef = adminDb.collection('meetings').doc();
      tx.set(meetingRef, {
        meetingsource: 'pitcherPage',
        pitcherId,
        pitcherName: pitcher.fullName || '',
        pitcherEmail: pitcher.email || '',
        listenerId: listenerUid,
        listenerName: listener.fullName || '',
        listenerEmail: listener.email || '',
        availability,
        donation: Number(pitcher.donation) || 0,
        reservedAmount,
        paymentSource: 'pitcher-balance',
        status: 'pending',
        acceptTokenHash: hash,
        tokenUsed: false,
        idempotencyKey,
        reservedAt: now,
        respondedAt: null,
        createdAt: now,
      });

      // No balance change here — pitcher hasn't acted yet.

      return {
        ok: {
          meetingId: meetingRef.id,
          rawToken: raw,
          reservedAmount,
          pitcherName: pitcher.fullName || '',
          pitcherEmail: pitcher.email || '',
          listenerName: listener.fullName || '',
          donationAmount: Number(pitcher.donation) || 0,
          availability,
        },
      };
    });

    if ('error' in txResult && txResult.error) {
      const e = txResult.error;
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    if (!('ok' in txResult) || !txResult.ok) {
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    const ok = txResult.ok;
    try {
      await sendPendingRequestEmailToPitcher({
        meetingId: ok.meetingId,
        rawToken: ok.rawToken,
        pitcherName: ok.pitcherName,
        pitcherEmail: ok.pitcherEmail,
        listenerName: ok.listenerName,
        amount: ok.reservedAmount,
        availability: ok.availability,
        donationAmount: ok.donationAmount,
      });
    } catch (emailErr) {
      console.error('[Pending Request Email Failed]', emailErr);
    }

    return NextResponse.json({
      meetingId: ok.meetingId,
      status: 'pending',
      reservedAmount: ok.reservedAmount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Request Meeting Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
