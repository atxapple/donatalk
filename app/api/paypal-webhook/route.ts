// app/api/paypal-webhook/route.ts
import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/verify-webhook';

export async function POST(req: Request) {
  const body = await req.json();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID!;

  const verified = await verifyWebhookSignature(req, body, webhookId);
  if (!verified) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const captureID = body.resource.id;
    console.log(`✅ Payment completed! Capture ID: ${captureID}`);
    // Here you could update your DB to mark the payment as confirmed
  }

  return NextResponse.json({ status: 'ok' });
}
