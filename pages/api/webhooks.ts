// pages/api/webhooks.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { firestore } from '../../firebase/clientApp';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false, // Stripe needs the raw body!
  },
};

const buffer = async (readable: any) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    readable.on('data', (chunk: any) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Listen to the successful checkout session
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const pitcherId = session.metadata?.pitcherId;
    const amount = session.amount_total! / 100; // Convert cents back to dollars

    if (pitcherId && amount) {
      try {
        const docRef = doc(firestore, 'pitchers', pitcherId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const currentBalance = docSnap.data().credit_balance || 0;
          await updateDoc(docRef, {
            credit_balance: currentBalance + amount,
          });
          console.log(`✅ Credit balance updated for pitcher ${pitcherId}: +$${amount}`);
        } else {
          console.error(`⚠️ Pitcher not found: ${pitcherId}`);
        }
      } catch (error) {
        console.error('❌ Error updating credit balance:', error);
        return res.status(500).send('Failed to update credit balance');
      }
    }
  }

  res.status(200).send('Webhook received successfully');
}
