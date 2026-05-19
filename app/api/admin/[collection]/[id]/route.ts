import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import slugify from 'slugify';

const VALID_COLLECTIONS = ['pitchers', 'listeners'] as const;
type Collection = (typeof VALID_COLLECTIONS)[number];

const PITCHER_FIELDS = ['fullName', 'pitch', 'donation', 'credit_balance', 'isSetUp'];
const LISTENER_FIELDS = ['fullName', 'intro', 'donation', 'isSetUp'];

function getAllowedFields(collection: Collection): string[] {
  return collection === 'pitchers' ? PITCHER_FIELDS : LISTENER_FIELDS;
}

function isValidCollection(value: string): value is Collection {
  return (VALID_COLLECTIONS as readonly string[]).includes(value);
}

async function generateUniqueSlug(baseName: string, excludeDocId?: string): Promise<string> {
  const baseSlug = slugify(baseName, { lower: true, remove: /[^a-zA-Z0-9]/g });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const pitcherSnap = await adminDb.collection('pitchers').where('slug', '==', slug).get();
    const listenerSnap = await adminDb.collection('listeners').where('slug', '==', slug).get();

    const pitcherConflict = pitcherSnap.docs.filter((d) => d.id !== excludeDocId);
    const listenerConflict = listenerSnap.docs.filter((d) => d.id !== excludeDocId);

    if (pitcherConflict.length === 0 && listenerConflict.length === 0) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

type RouteContext = { params: Promise<{ collection: string; id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const authResult = await verifyAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { collection, id } = await context.params;

  if (!isValidCollection(collection)) {
    return NextResponse.json({ error: `Invalid collection: ${collection}` }, { status: 400 });
  }

  try {
    const body = await req.json();
    const allowedFields = getAllowedFields(collection);
    const updates: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Coerce numeric fields
    if ('donation' in updates) updates.donation = Number(updates.donation) || 0;
    if ('credit_balance' in updates) updates.credit_balance = Number(updates.credit_balance) || 0;

    const docRef = adminDb.collection(collection).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // If fullName changed, regenerate slug
    const currentData = docSnap.data()!;
    if ('fullName' in updates && updates.fullName !== currentData.fullName) {
      updates.slug = await generateUniqueSlug(updates.fullName as string, id);
    }

    // If setting isSetUp to true on a soft-deleted doc, clear deletedAt (restore)
    if (updates.isSetUp === true && currentData.deletedAt) {
      updates.deletedAt = FieldValue.delete();
    }

    await docRef.update(updates);

    const updatedSnap = await docRef.get();
    return NextResponse.json({ data: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Admin PATCH Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const authResult = await verifyAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const { collection, id } = await context.params;

  if (!isValidCollection(collection)) {
    return NextResponse.json({ error: `Invalid collection: ${collection}` }, { status: 400 });
  }

  try {
    const docRef = adminDb.collection(collection).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await docRef.update({
      deletedAt: FieldValue.serverTimestamp(),
      isSetUp: false,
    });

    // Sweep pending/reserved meetings that reference this user and release reservations.
    // Filter to the new pitcher-balance flow so legacy escrow/pending meetings stay untouched.
    const affectedField = collection === 'pitchers' ? 'pitcherId' : 'listenerId';
    const meetingsSnap = await adminDb
      .collection('meetings')
      .where(affectedField, '==', id)
      .where('paymentSource', '==', 'pitcher-balance')
      .where('status', 'in', ['reserved', 'pending'])
      .get();

    let releasedCount = 0;
    for (const meetingDoc of meetingsSnap.docs) {
      const meeting = meetingDoc.data();
      try {
        await adminDb.runTransaction(async (tx) => {
          const fresh = await tx.get(meetingDoc.ref);
          if (!fresh.exists) return;
          const data = fresh.data()!;
          if (!['reserved', 'pending'].includes(data.status)) return;

          if (data.status === 'reserved') {
            const pitcherRef = adminDb.collection('pitchers').doc(data.pitcherId);
            tx.update(pitcherRef, {
              reservedBalance: FieldValue.increment(-Number(data.reservedAmount || 0)),
              pendingReservationCount: FieldValue.increment(-1),
            });
          }
          tx.update(meetingDoc.ref, {
            status: 'cancelled',
            cancelReason: 'admin-soft-delete',
            tokenUsed: true,
            respondedAt: Timestamp.now(),
          });
        });
        releasedCount += 1;
      } catch (sweepErr) {
        console.error(`[Admin Sweep Failed meeting=${meetingDoc.id}]`, sweepErr);
      }
      // Note: caller is responsible for the affected-user notification policy.
      // Skipping email here keeps the admin sweep idempotent and fast; we can
      // surface affected meetings in the admin response if needed later.
      void meeting;
    }

    // Check if paired profile exists
    const pairedCollection = collection === 'pitchers' ? 'listeners' : 'pitchers';
    const pairedDoc = await adminDb.collection(pairedCollection).doc(id).get();

    return NextResponse.json({
      deleted: true,
      hasPairedProfile: pairedDoc.exists,
      pairedCollection,
      meetingsCancelled: releasedCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Admin DELETE Error]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
