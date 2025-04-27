// app/api/complete-order/route.ts

import { NextResponse } from 'next/server';
import { updateFunds } from '../update-funds/route'; // Import the update-funds logic directly

export async function POST(req: Request) {
  const { orderID, intent } = await req.json();

  // console.log('req:', req);
  
  const pitcherId = req.headers.get('pitcherId');
  

  const base = process.env.PAYPAL_API_URL;
  const auth = `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_APP_SECRET}`;
  const accessTokenResponse = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await accessTokenResponse.json();

  const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderID}/${intent}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  });

  const result = await captureResponse.json();
  // console.log('result:', result);
  // console.log('id:', result.id);
  // console.log('pitcherId:', pitcherId);
  // console.log('amount: ', result.purchase_units[0].payments.captures[0].amount.value)

  if (result.status === 'COMPLETED') {
    const amountCaptured = parseFloat(result.purchase_units[0].payments.captures[0].amount.value);
    const refID = result.id; // Securely passed when creating the order

    // ✅ Securely call your internal fund update logic
    const fundUpdateResult = updateFunds({
      refID: refID,
      pitcherId: pitcherId,
      amount: amountCaptured,
    });
    return NextResponse.json({
      success: true,
      status: result.status,
      message: 'Payment completed'
    });
  } else {
    return NextResponse.json({ success: false, message: 'Payment not completed', status: result.status });
  }

  return NextResponse.json(result);
}
