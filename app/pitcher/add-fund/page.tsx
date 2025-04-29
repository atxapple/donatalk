'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';
import { auth } from '@/firebase/clientApp';

const SuccessBox = styled('div', {
  backgroundColor: '#e6f9e8',
  border: '2px solid #2ecc71',
  borderRadius: '8px',
  padding: '12px 20px',
  color: '#27ae60',
  textAlign: 'center',
  fontWeight: 'bold',
  marginTop: '20px',
});

export default function PitcherAddFund() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encriptedAmount = searchParams?.get('a') || '0'; // Default to '0' if null
  const amount: number = parseFloat(encriptedAmount) / 7900.0;

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
    let userID = currentUser?.uid;

    console.log('[userID] :', userID);

    if (!currentUser) {
      alert('❌ No user logged in.');
      return;
    }

    try {
      const res = await fetch("/api/complete-order-and-update-fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          orderID: data.orderID, 
          intent: "capture", 
          pitcherId: userID }),
      });

      if (!res.ok) {
        throw new Error('Failed to complete order.');
      }

      const result = await res.json();

      if (result.status === 'COMPLETED') {
        // ✅ Redirect to profile page after success
        router.push('/pitcher/profile');
      } else {
        alert(`⚠️ Payment was not completed. Status: ${result.status}`);
      }
    } catch (error) {
      console.error('Payment capture error:', error);
      alert('❌ Payment completed but an error occurred during fund update.');
    }
  };

  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <Title>Fund Your Account</Title>
        <Subtitle>Adding <span style={{ color: '#E74C3C' }}>${amount}</span> to your credit balance</Subtitle>

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
            currency: 'USD',
            'disable-funding': 'paylater',
          }}
        >
          <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <PayPalButtons
              createOrder={() => createOrder()}
              onApprove={onApprove} // ✅ Directly pass the function
              style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
            />
          </div>
        </PayPalScriptProvider>
      </CardContainer>
    </PageWrapper>
  );
}
