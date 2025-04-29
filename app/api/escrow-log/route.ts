// app/api/escrow-log/route.ts

import { NextResponse } from 'next/server';
import { sendEmailfromListenerPage } from '@/lib/sendEmailfromListenerPage';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  console.log('[Escrow Log] Request received');

  try {
    const { orderID, intent, pitcherEmail, pitcherName, listenerId, message } = await req.json();

    if (!orderID || !intent || !pitcherEmail || !pitcherName || !listenerId || !message) {
      console.error('[Validation Error] Missing one or more required fields: orderID, intent, pitcherEmail, pitcherName, listenerId, or message');
      return NextResponse.json(
        { success: false, message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    console.log('[Payload]', { orderID, intent, pitcherEmail, pitcherName, listenerId, message });

    // ✅ Capture payment from PayPal
    const captureRes = await fetch(`${BASE_URL}/api/complete-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderID, intent }),
    });

    const captureResult = await captureRes.json();
    console.log('[PayPal Capture Result]', captureResult);

    if (captureResult.status !== 'COMPLETED') {
      console.error('[Capture Error] Payment not completed.');
      return NextResponse.json(
        {
          success: false,
          message: 'Payment not completed.',
          status: captureResult.status,
        },
        { status: 400 }
      );
    }

    const amountCaptured = parseFloat(
      captureResult.purchase_units[0].payments.captures[0].amount.value
    );
    const refID = captureResult.id;

    console.log('[Fund Update]', { refID, amountCaptured, pitcherEmail, listenerId });

    // ✅ Send notification email
    const emailResult = await sendEmailfromListenerPage({
      pitcherName,
      pitcherEmail,
      amountCaptured,
      listenerId,
      message,
    });

    console.log('[Email Send Result]', emailResult);

    if (!emailResult.success) {
      console.error('[Email Sending Error]', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          message: 'Payment captured, but failed to send notification email.',
          error: emailResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: captureResult.status,
      message: 'Payment completed and notification email sent successfully.',
    });

  } catch (error: any) {
    console.error('[Escrow Log Error]', error.message || error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred during payment and notification processing.',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
