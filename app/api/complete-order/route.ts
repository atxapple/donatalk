import { NextResponse } from 'next/server';
import { updateFunds } from '../update-funds/route';

export async function POST(req: Request) {
  try {
    const { orderID, intent } = await req.json();
    const pitcherId = req.headers.get('PitcherID'); // ✅ Pitcher UID sent securely from client
    if (!pitcherId) {
      return NextResponse.json({ success: false, message: 'Missing Pitcher ID' }, { status: 400 });
    }

    const base = process.env.PAYPAL_API_URL;
    const auth = `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_APP_SECRET}`;
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

    console.log('Payment Result:', result);

    if (result.status === 'COMPLETED') {
      const amountCaptured = parseFloat(result.purchase_units[0].payments.captures[0].amount.value);
      const refID = result.purchase_units[0].reference_id; // Securely passed during create-order

      console.log(`[Complete Order] RefID: ${refID}, Amount: ${amountCaptured}, PitcherID: ${pitcherId}`);

      // ✅ Wait for fund update before returning success:
      const fundUpdateResult = await updateFunds({
        refID,
        pitcherId,
        amount: amountCaptured,
      });

      if (fundUpdateResult.success) {
        return NextResponse.json({
          success: true,
          status: result.status,
          message: 'Payment completed and funds updated successfully.',
          newBalance: fundUpdateResult.newBalance,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Payment captured, but failed to update funds.',
          error: fundUpdateResult.error,
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment not completed.',
        status: result.status,
      });
    }
  } catch (error: any) {
    console.error('[Complete Order Error]', error.message);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred.',
      error: error.message,
    }, { status: 500 });
  }
}
