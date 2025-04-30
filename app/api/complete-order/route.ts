// app/api/complete-order/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {

  try {
    const { orderID, intent } = await req.json();

    if (!orderID || !intent) {
      console.error('[Validation Error] Missing orderID or intent');
      return NextResponse.json(
        { success: false, message: 'Missing orderID or intent' },
        { status: 400 }
      );
    }

    const base = process.env.PAYPAL_API_URL;
    const auth = `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`;

    // ✅ Step 1: Get PayPal access token
    const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('[PayPal Token Error]', tokenData);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve PayPal access token' },
        { status: 500 }
      );
    }

    // console.log('[PayPal Token Retrieved]');

    // ✅ Step 2: Capture payment
    const captureResponse = await fetch(`${base}/v2/checkout/orders/${orderID}/${intent}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const result = await captureResponse.json();
    // console.log('[PayPal Capture Result]', result);

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('[Complete Order Error]', error.message || error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during payment processing.',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
