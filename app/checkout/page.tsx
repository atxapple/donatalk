'use client';

import { useSearchParams } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';

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

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const amount = searchParams?.get('amount');

  if (!amount || parseFloat(amount) <= 0) {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "capture", amount }),
    });
    const data = await res.json();
    return data.id;
  };

  const onApprove = async (data: any) => {
    const res = await fetch("/api/complete-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderID: data.orderID, intent: "capture" }),
    });
    const result = await res.json();
    alert(`✅ Payment completed! Status: ${result.status}`);
  };

  return (
    <>
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
                onApprove={(data) => onApprove(data)}
                style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
              />
            </div>
          </PayPalScriptProvider>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
