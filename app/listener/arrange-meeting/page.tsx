'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';
import { auth } from '@/firebase/clientApp';

export default function ArrangeMeeting() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const encryptedAmount = searchParams?.get('a') || '0';
  const pitcherEmail = searchParams?.get('pitcherEmail') || '';
  const pitcherName = searchParams?.get('pitcherName') || '';
  const listenerId = searchParams?.get('listenerId') || ''; // ⚡ Fixed typo: was 'ilstenerId'
  const message = searchParams?.get('message') || '';

  const amount = parseFloat(encryptedAmount) / 7900.0;

  console.log('[ArrangeMeeting Params]', { amount, pitcherEmail, pitcherName, listenerId, message });

  if (!amount || amount <= 0) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Payment Error</Title>
          <ErrorBox>❌ Invalid fund amount. Please go back and enter a valid amount.</ErrorBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const createOrder = async () => {
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: "capture", amount }),
    });
    const data = await res.json();
    return data.id;
  };

  const onApprove = async (data: any) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert('❌ No user logged in.');
      return;
    }

    try {
      const res = await fetch("/api/escrow-log", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderID: data.orderID,
          intent: "capture",
          pitcherEmail,
          pitcherName,
          listenerId,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to complete escrow log.');
      }

      const result = await res.json();
      console.log('[Escrow Log Result]', result);

      if (result.status === 'COMPLETED') {
        router.push('/arrange-notification');
      } else {
        alert(`⚠️ Escrow was not completed. Status: ${result.status}`);
      }
    } catch (error) {
      console.error('[Escrow Log Error]', error);
      alert('❌ Payment was captured but an error occurred during fund update.');
    }
  };

  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <Title>Fund Your Account</Title>
        <Subtitle>
          Adding <span style={{ color: '#E74C3C' }}>${amount.toFixed(2)}</span> to your credit balance
        </Subtitle>

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
            currency: 'USD',
            'disable-funding': 'paylater',
          }}
        >
          <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <PayPalButtons
              createOrder={createOrder}
              onApprove={onApprove}
              style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
            />
          </div>
        </PayPalScriptProvider>
      </CardContainer>
    </PageWrapper>
  );
}
