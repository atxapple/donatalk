import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { firestore } from '../../firebase/clientApp';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature']!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook Error: ${(err as Error).message}`);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const pitcherId = session.metadata?.pitcherId;
      const amount = session.amount_total; // Amount in cents

      if (pitcherId && amount) {
        const pitcherRef = doc(firestore, 'pitchers', pitcherId);
        const pitcherSnap = await getDoc(pitcherRef);

        if (pitcherSnap.exists()) {
          const currentBalance = pitcherSnap.data().credit_balance || 0;
          await updateDoc(pitcherRef, {
            credit_balance: currentBalance + amount / 100, // Convert cents to dollars
            updatedAt: Date.now(),
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
