// lib/updateFunds.ts

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

export async function updateFunds({
  refID,
  pitcherId,
  amount,
  eventType,
}: {
  refID: string;
  pitcherId: string;
  amount: number;
  eventType: string
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // console.log('[Update Funds]', pitcherId, refID, amount);
    if (!pitcherId || !refID || typeof amount !== 'number' || !eventType) {
      throw new Error('Invalid pitcherId, refID, amount, or eventType.');
    }

    const pitcherRef = db.collection('pitchers').doc(pitcherId);
    const pitcherDoc = await pitcherRef.get();

    if (!pitcherDoc.exists) {
      throw new Error(`Pitcher with UID ${pitcherId} not found.`);
    }

    const currentBalance = pitcherDoc.data()?.credit_balance || 0;
    const newBalance = currentBalance + amount;

    // ✅ Update the credit balance
    await pitcherRef.update({
      credit_balance: newBalance,
    });

    // ✅ Log fund history
    await db.collection('fund_history').add({
      amount,
      eventType: eventType,
      paymentIntentRefId: refID,
      pitcherId: pitcherId,
      timestamp: new Date(),
    });

    console.log(`[Update Funds] Added $${amount} to pitcher ${pitcherId}. New balance: ${newBalance}`);

    console.log('pitcherDoc Data', pitcherDoc.data()?.fullName, pitcherDoc.data()?.email, amount,);

    // ✅ Call the send-payment-confirm-email API
    const emailResponse = await fetch(`${BASE_URL}/api/send-payment-confirm-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pitcherName: pitcherDoc.data()?.fullName,
        pitcherEmail: pitcherDoc.data()?.email,
        amountPaid: amount,
      }),
    });

    if (!emailResponse.ok) {
      console.error('⚠️ Payment confirmation email failed to send.');
    } else {
      console.log('✅ Payment confirmation email sent successfully.');
    }

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('[Update Funds Error]', error.message);
    return { success: false, error: error.message };
  }
}
