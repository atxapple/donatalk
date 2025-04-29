// app/api/complete-order/route.ts

import { NextResponse } from 'next/server';
import { updateFunds } from '@/lib/updateFunds';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  
  // console.log('[complete-order-and-update-fund] :', req);
  try {
    const { orderID, intent, pitcherId } = await req.json();

    // console.log(`[Complete Order] OrderID: ${orderID}, Intent: ${intent}, PitcherID: ${pitcherId}`);

    if (orderID === undefined || intent === undefined || pitcherId === undefined) {
      return NextResponse.json({ success: false, message: 'Missing orderID, intent, or pitcherId' }, { status: 400 });
    } 

    try {
      const res = await fetch(`${BASE_URL}/api/complete-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderID: orderID, intent: intent}),
      });

      // console.log('[complete-order-and-update-fund] res :', res);

      const result = await res.json();
      // console.log('[complete-order-and-update-fund] result :', result);

      if (result.status === 'COMPLETED') {
        const amountCaptured = parseFloat(result.purchase_units[0].payments.captures[0].amount.value);
        const refID = result.id; // Securely passed during create-order
  
        console.log(`[Complete Order] RefID: ${refID}, Amount: ${amountCaptured}, PitcherID: ${pitcherId}`);
  
        // ✅ Wait for fund update before returning success:
        const fundUpdateResult = await updateFunds({
          refID,
          pitcherId,
          amount: amountCaptured,
          eventType: 'add_fund',
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
    } catch (error) {
      console.error('Payment capture error:', error);
      alert('❌ Payment completed but an error occurred during fund update.');
    }
  } catch (error: any) {
    console.error('[Complete Order and Update Fund Error]', error.message);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred.',
      error: error.message,
    }, { status: 500 });
  }
}
