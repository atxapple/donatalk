import { NextResponse } from 'next/server';
import { client } from '@/lib/paypal';
import * as paypal from '@paypal/checkout-server-sdk';

export async function POST(req: Request) {
  const body = await req.json();
  const amount = body.amount || '10.00'; // Default fallback

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{ amount: { currency_code: 'USD', value: amount } }],
  });

  try {
    const order = await client.execute(request);
    return NextResponse.json({ orderID: order.result.id });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
