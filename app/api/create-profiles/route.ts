// app/api/create-profiles/route.ts

import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import slugify from 'slugify';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName, { lower: true, remove: /[^a-zA-Z0-9]/g });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const pitcherSnap = await db.collection('pitchers').where('slug', '==', slug).get();
    const listenerSnap = await db.collection('listeners').where('slug', '==', slug).get();
    if (pitcherSnap.empty && listenerSnap.empty) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(req: Request) {
  try {
    const { uid, fullName, email, slug, role, pitch, donation, intro } = await req.json();

    if (!uid || !fullName || !email || !role) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const batch = db.batch();

    if (role === 'pitcher') {
      batch.set(db.collection('pitchers').doc(uid), {
        fullName,
        email,
        pitch: pitch || '',
        donation: typeof donation === 'number' ? donation : parseFloat(donation) || 0,
        credit_balance: 0,
        slug,
        isSetUp: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('listeners').doc(uid), {
        fullName,
        email,
        intro: '',
        donation: 0,
        slug,
        isSetUp: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (role === 'listener') {
      batch.set(db.collection('listeners').doc(uid), {
        fullName,
        email,
        intro: intro || '',
        donation: typeof donation === 'number' ? donation : parseFloat(donation) || 0,
        slug,
        isSetUp: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('pitchers').doc(uid), {
        fullName,
        email,
        pitch: '',
        donation: 0,
        credit_balance: 0,
        slug,
        isSetUp: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (role === 'both-stubs') {
      const profileSlug = slug || await generateUniqueSlug(fullName);

      batch.set(db.collection('pitchers').doc(uid), {
        fullName,
        email,
        pitch: '',
        donation: 0,
        credit_balance: 0,
        slug: profileSlug,
        isSetUp: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('listeners').doc(uid), {
        fullName,
        email,
        intro: '',
        donation: 0,
        slug: profileSlug,
        isSetUp: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid role.' },
        { status: 400 }
      );
    }

    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Create Profiles Error]', error.message || error);
    return NextResponse.json(
      { success: false, message: 'Failed to create profiles.' },
      { status: 500 }
    );
  }
}
