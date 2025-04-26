'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';

export default function CheckoutPage() {
  const [amount, setAmount] = useState<string>('10.00');
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  return (
    <PayPalScriptProvider
      options={{
        'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        'disable-funding': 'paylater',
      }}
    >
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">PayPal Secure Checkout</h1>

        <label className="block mb-4 font-medium">
          Enter Amount (USD):
          <input
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={handleAmountChange}
            className="mt-1 w-full border rounded p-2"
          />
        </label>

        {paid ? (
          <div className="text-green-600 font-semibold mt-4">✅ Payment Confirmed!</div>
        ) : (
          <PayPalButtons
            style={{ layout: 'vertical' }}
            createOrder={async () => {
              const res = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
              });
              const data = await res.json();
              return data.orderID;
            }}
            onApprove={async (data) => {
              const res = await fetch('/api/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: data.orderID }),
              });
              const result = await res.json();
              if (result.status === 'COMPLETED') {
                setPaid(true);
              } else {
                setError('Payment could not be confirmed.');
              }
            }}
            onError={(err) => {
              console.error('❌ Payment Error:', err);
              setError('Payment failed. Please try again.');
            }}
          />
        )}

        {error && <div className="text-red-600 mt-4">{error}</div>}
      </div>
    </PayPalScriptProvider>
  );
}
