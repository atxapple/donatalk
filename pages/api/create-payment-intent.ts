// pages/api/create-payment-intent.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, pitcherId } = req.body;

    if (!amount || !pitcherId || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'DonaTalk Credit Balance Top-Up' },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        pitcherId: pitcherId,
      },
      success_url: `${req.headers.origin}/pitcher/profile?payment=success`,
      cancel_url: `${req.headers.origin}/pitcher/profile?payment=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
