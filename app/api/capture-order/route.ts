import { NextResponse } from 'next/server';
import { client } from '@/lib/paypal';
import * as paypal from '@paypal/checkout-server-sdk';

export async function POST(req: Request) {
  const body = await req.json();
  const orderID = body.orderID;

  if (!orderID) {
    return NextResponse.json({ error: 'Missing orderID' }, { status: 400 });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({}); // Must be empty per PayPal docs

  try {
    const capture = await client.execute(request);
    const status = capture.result.status;

    console.log('✅ Capture Result:', JSON.stringify(capture.result, null, 2));

    // Optionally: Here is where you could update your database: mark order as paid

    return NextResponse.json({ status, captureID: capture.result.purchase_units[0].payments.captures[0].id });
  } catch (error) {
    console.error('❌ Capture Error:', error);
    return NextResponse.json({ error: 'Capture failed' }, { status: 500 });
  }
}
