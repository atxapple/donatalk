// app/api/escrow-log/route.ts

import { NextResponse } from 'next/server';
import { sendEmailfromListenerPage } from '@/lib/sendEmailfromListenerPage';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: Request) {

  console.log('[Escrow Log] :', req);

  try {
    const { orderID, intent, pitcherEmail, pitcherName,listenerId, message } = await req.json();

    if (!orderID || !intent || !pitcherEmail || !pitcherName || !listenerId || !message) {
      console.error('[Validation Error] Missing orderID, intent, pitcherEmail, pitcherName, listenerId, or message');
      return NextResponse.json(
        { success: false, message: 'Missing orderID, intent, pitcherEmail, pitcherName, listenerId, or message' },
        { status: 400 }
      );
    }

    console.log('[orderID, intent, pitcherEmail, pitcherName, listenerId, message]', orderID, intent, pitcherEmail, pitcherName, listenerId, message);
          
    const captureRes = await fetch(`${BASE_URL}/api/complete-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderID, intent }),
    });

    const captureResult = await captureRes.json();

    console.log('[PayPal Capture Result]', captureResult);

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

    console.log(`[Fund Update] RefID: ${refID}, Amount: ${amountCaptured}, pitcherEmail: ${pitcherEmail}, listenerId: ${listenerId}`);

    const sendEmailfromListenerPageResult = sendEmailfromListenerPage({
      pitcherName,
      pitcherEmail,
      amountCaptured,
      listenerId,
      message,
    });
    console.log(
      '[sendEmailfromListenerPageResult]',
      sendEmailfromListenerPageResult
    )
    // const fundUpdateResult = await updateFunds({
    //   refID,
    //   pitcherId,
    //   amount: amountCaptured,
    //   eventType: 'add_fund',
    // });

    // if (!fundUpdateResult.success) {
    //   console.error('[Fund Update Failed]', fundUpdateResult.error);
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'Payment captured, but failed to update funds.',
    //       error: fundUpdateResult.error,
    //     },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json({
      success: true,
      status: captureResult.status,
      message: 'Payment completed and funds updated successfully.',
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
