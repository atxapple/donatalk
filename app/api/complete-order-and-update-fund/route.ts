// app/api/complete-order-and-update-fund/route.ts

import { NextResponse } from 'next/server';
import { updateFunds } from '@/lib/updateFunds';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const { orderID, intent, pitcherId } = await req.json();

    if (!orderID || !intent || !pitcherId) {
      console.error('[Validation Error] Missing orderID, intent, or pitcherId');
      return NextResponse.json(
        { success: false, message: 'Missing orderID, intent, or pitcherId' },
        { status: 400 }
      );
    }
    const captureRes = await fetch(`${BASE_URL}/api/complete-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderID, intent }),
    });

    const captureResult = await captureRes.json();
    // console.log('[PayPal Capture Result]', captureResult);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json({
        success: false,
        message: 'Payment not completed.',
        status: captureResult.status,
      });
    }

    const amountCaptured = parseFloat(
      captureResult.purchase_units[0].payments.captures[0].amount.value
    );
    const refID = captureResult.id;

    console.log(`[Fund Update] RefID: ${refID}, Amount: ${amountCaptured}, PitcherID: ${pitcherId}`);

    const fundUpdateResult = await updateFunds({
      refID,
      pitcherId,
      amount: amountCaptured,
      eventType: 'add_fund',
    });

    if (!fundUpdateResult.success) {
      console.error('[Fund Update Failed]', fundUpdateResult.error);
      return NextResponse.json(
        {
          success: false,
          message: 'Payment captured, but failed to update funds.',
          error: fundUpdateResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: captureResult.status,
      message: 'Payment completed and funds updated successfully.',
      newBalance: fundUpdateResult.newBalance,
    });
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
