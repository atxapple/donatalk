import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { amount, meetingId, listenerId, pitcherId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // e.g., 5000 = $50
      currency: "usd",
      capture_method: "manual", // escrow-like hold
      metadata: {
        meetingId,
        listenerId,
        pitcherId,
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("PaymentIntent Error", error);
    res.status(500).json({ error: "Failed to create PaymentIntent" });
  }
}
