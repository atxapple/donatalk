// app/api/complete-order/route.ts

import { NextResponse } from 'next/server';
import { updateFunds } from '@/lib/updateFunds';

export async function POST(req: Request) {
  
  // console.log('[Complete Order] :', req);
  try {
    const { orderID, intent } = await req.json();

    if (orderID === undefined || intent === undefined) {
      return NextResponse.json({ success: false, message: 'Missing orderID or intent' }, { status: 400 });
    }

    const base = process.env.PAYPAL_API_URL;
    const auth = `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`;
    const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const { access_token } = await tokenResponse.json();

    const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderID}/${intent}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const result = await captureResponse.json();
    // console.log('Payment Result:', result);
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('[Complete Order Error]', error.message);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred.',
      error: error.message,
    }, { status: 500 });
  }
}
