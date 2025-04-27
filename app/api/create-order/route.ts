// app/api/create-order/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('[Create Order] :', req);
  const { intent, amount } = await req.json();
  const parsedAmount = parseFloat(amount);

  // console.log('[intent, amount] :', {intent, amount});

  // ✅ Amount Validation (prevent abuse)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const base = process.env.PAYPAL_API_URL;
  const auth = `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`;
  
  // console.log('[base, auth] :', {base, auth});

  const accessTokenResponse = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const { access_token } = await accessTokenResponse.json();

  // console.log('[access_token] :', access_token);

  const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      intent: intent.toUpperCase(),
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: parsedAmount.toFixed(2),
          },
        },
      ],
    }),
  });

  const order = await orderResponse.json();
  return NextResponse.json(order);
}
