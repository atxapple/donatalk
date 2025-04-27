import { NextRequest, NextResponse } from 'next/server';
import { buffer } from 'stream/consumers';

export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID; // from PayPal dashboard
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;

  const rawBody = await req.text();
  const headers = req.headers;

  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionTime = headers.get('paypal-transmission-time');
  const certUrl = headers.get('paypal-cert-url');
  const authAlgo = headers.get('paypal-auth-algo');
  const transmissionSig = headers.get('paypal-transmission-sig');
  const webhookEvent = JSON.parse(rawBody);

  // Step 1: Validate webhook signature
  const verifyResponse = await fetch(
    'https://api-m.paypal.com/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64'),
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    }
  );

  const verifyResult = await verifyResponse.json();

  if (verifyResult.verification_status !== 'SUCCESS') {
    return NextResponse.json({ message: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Step 2: Handle the event
  if (webhookEvent.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const capture = webhookEvent.resource;
    const amount = capture.amount.value;
    const payerEmail = capture.payer.email_address;

    console.log('✅ Payment confirmed:', amount, payerEmail);

    // TODO: Update Firestore or DB to add funds to the correct Pitcher
    // Example (pseudo-code):
    // await firestore.collection('pitchers').doc(pitcherId).update({
    //   credit_balance: FieldValue.increment(parseFloat(amount)),
    // });

    return NextResponse.json({ message: 'Payment processed successfully' });
  }

  return NextResponse.json({ message: 'Event type not handled' });
}
