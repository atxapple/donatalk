import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { firestore } from '../../firebase/clientApp';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ Missing Stripe signature or webhook secret.');
    return res.status(400).send('Webhook Error: Missing Stripe signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`❌ Webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  console.log(`✅ Received Stripe event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pitcherId = session.metadata?.pitcherId;
    const amountTotal = session.amount_total;

    console.log(`👉 Session for pitcherId: ${pitcherId}, amount: ${amountTotal}`);

    if (!pitcherId || !amountTotal) {
      console.error('❌ Missing pitcherId or amountTotal in metadata.');
      return res.status(400).send('Missing metadata in session');
    }

    try {
      const pitcherRef = doc(firestore, 'pitchers', pitcherId);
      const pitcherSnap = await getDoc(pitcherRef);

      if (!pitcherSnap.exists()) {
        console.error(`❌ Pitcher with ID ${pitcherId} does not exist.`);
        return res.status(404).send('Pitcher not found');
      }

      const currentBalance = pitcherSnap.data().credit_balance || 0;
      const newBalance = currentBalance + amountTotal / 100;

      await updateDoc(pitcherRef, {
        credit_balance: newBalance,
        updatedAt: Date.now(),
      });

      console.log(`💰 Updated credit_balance for pitcher ${pitcherId} to $${newBalance}`);

      // ✅ Log the fund history
      await addDoc(collection(firestore, 'fund_history'), {
        pitcherId,
        amount: amountTotal / 100,
        paymentIntentId: session.payment_intent,
        eventType: 'add_fund',
        timestamp: new Date(),
      });

      console.log('📝 Fund change logged successfully in fund_history.');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('❌ Error updating credit balance or logging fund history:', error.message);
      return res.status(500).send('Internal Server Error');
    }
  }

  res.status(200).json({ received: true });
}
