// lib/sendEmailfromListenerPage.ts

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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

/**
 * Sends an email notification after a listener signs up.
 */
export async function sendEmailfromListenerPage({
  pitcherName,
  pitcherEmail,
  amountCaptured,
  listenerId,
  message,
}: {
  pitcherName: string;
  pitcherEmail: string;
  amountCaptured: number;
  listenerId: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {

  console.log('[Send Email Request]', { pitcherName, pitcherEmail, amountCaptured, listenerId, message });

  try {
    if (!pitcherEmail || typeof amountCaptured !== 'number' || !listenerId) {
      throw new Error('Invalid input: pitcherEmail, amountCaptured, or listenerId is missing or incorrect.');
    }

    // Fetch listener details
    const listenerRef = db.collection('listeners').doc(listenerId);
    const listenerDoc = await listenerRef.get();

    if (!listenerDoc.exists) {
      throw new Error(`Listener with ID ${listenerId} not found.`);
    }

    const listenerName = listenerDoc.data()?.fullName || '';
    const listenerEmail = listenerDoc.data()?.email || '';

    if (!listenerName || !listenerEmail) {
      throw new Error('Listener name or email is missing.');
    }

    console.log('[Listener Info]', { listenerName, listenerEmail });

    // Send email notification
    const emailResponse = await fetch(`${BASE_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pitcherName,
        pitcherEmail,
        listenerName,
        listenerEmail,
        message,
        donation: amountCaptured,
        source: 'listenerPage',
      }),
    });

    if (!emailResponse.ok) {
      console.error('[Send Email] Failed to send notification email.');
    } else {
      console.log('[Send Email] Notification email sent successfully.');
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Send Email Error]', error.message || error);
    return { success: false, error: error.message || 'Unknown error occurred.' };
  }
}
