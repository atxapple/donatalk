// app/api/update-funds/route.ts

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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
}: {
  refID: string;
  pitcherId: string;
  amount: number;
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    console.log('[Update Funds]', pitcherId, refID, amount);
    if (!pitcherId || !refID || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid pitcherId, refID, or amount');
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
      eventType: 'add_fund',
      paymentIntentRefId: refID,
      pitcherId: pitcherId,
      timestamp: new Date(),
    });

    console.log(`[Update Funds] Added $${amount} to pitcher ${pitcherId}. New balance: ${newBalance}`);

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('[Update Funds Error]', error.message);
    return { success: false, error: error.message };
  }
}
