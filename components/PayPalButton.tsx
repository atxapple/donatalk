'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useEffect } from 'react';

interface PayPalButtonProps {
  amount: string;
  onSuccess: (details: any) => void;
}

export default function PayPalButton({ amount, onSuccess }: PayPalButtonProps) {
  const [{ isPending }, dispatch] = usePayPalScriptReducer();

  useEffect(() => {
    dispatch({
      type: 'resetOptions',
      value: {
        'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        currency: 'USD',
      },
    });
  }, [dispatch]);

  return (
    <>
      {isPending ? <div>Loading...</div> : null}
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount,
                },
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          const details = await actions.order?.capture();
          if (details) {
            onSuccess(details);
          }
        }}
      />
    </>
  );
}
