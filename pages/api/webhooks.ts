import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { firestore } from '../../firebase/clientApp';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig as string, endpointSecret);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Webhook Error: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pitcherId = session.metadata?.pitcherId;
    const amountReceived = session.amount_total ?? 0;

    if (pitcherId) {
      const docRef = doc(firestore, 'pitchers', pitcherId);
      const pitcherSnap = await getDoc(docRef);

      if (pitcherSnap.exists()) {
        const currentBalance = pitcherSnap.data().credit_balance || 0;
        await updateDoc(docRef, {
          credit_balance: currentBalance + amountReceived / 100, // Convert cents to dollars
        });
      }
    }
  }

  res.status(200).json({ received: true });
}
