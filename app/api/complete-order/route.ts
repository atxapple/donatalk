// app/api/complete-order/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { orderID, intent } = await req.json();
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
  console.log('result:',result);
  console.log('id:',result.id);
  return NextResponse.json(result);
}
