import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { firestore } from '../../firebase/clientApp';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});  // ✅ your preferred approach

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] as string;
  const buf = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pitcherId = session.metadata?.pitcherId;
    const amount = session.amount_total;

    if (!pitcherId || !amount) {
      console.error('Missing pitcherId or amount in webhook data');
      return res.status(400).send('Invalid data');
    }

    try {
      const pitcherRef = doc(firestore, 'pitchers', pitcherId);
      const pitcherSnap = await getDoc(pitcherRef);

      if (pitcherSnap.exists()) {
        const currentBalance = pitcherSnap.data().credit_balance || 0;
        const newBalance = currentBalance + amount / 100; // convert cents to dollars

        await updateDoc(pitcherRef, {
          credit_balance: newBalance,
          updatedAt: Date.now(),
        });

        // ✅ Log fund history
        const historyRef = collection(firestore, 'pitchers', pitcherId, 'fund_history');
        await addDoc(historyRef, {
          amount: amount / 100,
          timestamp: serverTimestamp(),
          status: 'succeeded',
          description: 'Fund added via Stripe payment',
          paymentIntentId: session.payment_intent,
        });

        console.log(`✅ Updated balance for pitcher ${pitcherId}. New balance: ${newBalance}`);
      } else {
        console.error(`Pitcher with ID ${pitcherId} not found.`);
      }
    } catch (error) {
      console.error('Error updating credit balance or logging fund history:', error);
      return res.status(500).send('Internal server error');
    }
  }

  res.status(200).send('Webhook received successfully');
}
