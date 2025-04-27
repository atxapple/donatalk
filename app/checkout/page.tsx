// app/checkout/page.tsx


'use client';

import { useSearchParams } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const amount = searchParams?.get('amount') || '0';

  const [paymentCompleted, setPaymentCompleted] = useState(false);

  if (!amount || parseFloat(amount) <= 0) {
    return <p>Invalid or missing amount. Please enter a valid amount on the profile page.</p>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Checkout</h1>
      <p>Amount to Fund: ${amount}</p>

      {paymentCompleted ? (
        <p>✅ Payment Completed Successfully!</p>
      ) : (
        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
            currency: 'USD',
            disableFunding: 'paylater',
          }}
        >
          <PayPalButtons
            style={{ layout: 'vertical' }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: 'CAPTURE', // ✅ This is REQUIRED
                purchase_units: [
                  {
                    amount: {
                      currency_code: 'USD',        // ✅ Required
                      value: String(amount),       // ✅ Ensure string type
                    },
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              const details = await actions.order?.capture();
              if (details) {
                setPaymentCompleted(true);
                console.log('Payment successful:', details);
                // Optionally send details to your server to update the fund balance
              }
            }}
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
}
