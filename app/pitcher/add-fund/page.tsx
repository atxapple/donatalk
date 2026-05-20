'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';
import { auth, firestore } from '@/firebase/clientApp';
import { getSafeReturnPath } from '@/lib/safeReturn';
import {
  PageHeading,
  PageSubheading,
  IntroCard,
  InfoLine,
  InfoLineGroup,
} from '@/components/ui/profileCards';

const INCREMENT = 5;
const PRESETS = [5, 10, 25, 50, 100];

function readReturnPath(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return getSafeReturnPath(params.get('return'));
}

function roundUpToIncrement(n: number): number {
  if (n <= 0) return INCREMENT;
  return Math.ceil(n / INCREMENT) * INCREMENT;
}

const PresetGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '$sm',
  width: '100%',
  marginTop: '$md',
  '@media (max-width: 480px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
});

const PresetButton = styled('button', {
  padding: '14px 0',
  borderRadius: '$md',
  border: '1px solid #e0e3e6',
  backgroundColor: '#fff',
  fontSize: '$base',
  fontWeight: 600,
  color: '$dark',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  '&:hover': { borderColor: '$heart' },
  variants: {
    selected: {
      true: {
        borderColor: '$heart',
        backgroundColor: '#fff5f3',
        color: '$heart',
      },
    },
  },
});

const CustomAmountWrapper = styled('label', {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  width: '100%',
  marginTop: '$md',
  fontSize: '13px',
  color: '$darkgray',
});

const CustomAmountRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$sm',
  padding: '8px 12px',
  borderRadius: '$md',
  border: '1px solid #e0e3e6',
  backgroundColor: '#fff',
  '&:focus-within': { borderColor: '$heart' },
});

const Dollar = styled('span', {
  fontSize: '$base',
  fontWeight: 600,
  color: '$darkgray',
});

const CustomAmountInput = styled('input', {
  flex: 1,
  fontSize: '$base',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: '$dark',
  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  MozAppearance: 'textfield',
});

const HintBox = styled('div', {
  marginTop: '$md',
  padding: '12px 14px',
  borderRadius: '$md',
  fontSize: '13px',
  textAlign: 'center',
  variants: {
    tone: {
      info: {
        backgroundColor: '#eaf6ff',
        border: '1px solid #b6dbfa',
        color: '#1d4e78',
      },
      warn: {
        backgroundColor: '#fff8e1',
        border: '1px solid #ffe082',
        color: '#7a4c00',
      },
    },
  },
});

const PayPalArea = styled('div', {
  marginTop: '$md',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
});

const NotLoggedInBox = styled('div', {
  padding: '$md',
  textAlign: 'center',
  color: '$darkgray',
});

const SuccessBox = styled('div', {
  marginTop: '$md',
  padding: '12px 14px',
  borderRadius: '$md',
  textAlign: 'center',
  fontWeight: 600,
  backgroundColor: '#e6f9e8',
  border: '2px solid #2ecc71',
  color: '#1c7a3a',
});

export default function PitcherAddFund() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ?min= is the suggested minimum from the listener page (gap-to-cover).
  // Treat as a hint; the server doesn't trust it.
  const rawMin = searchParams?.get('min');
  const parsedMin = rawMin ? Math.max(0, parseFloat(rawMin)) : 0;
  const suggestedMin = isNaN(parsedMin) ? 0 : parsedMin;

  // Choose an initial amount:
  //   - If a suggested min was provided, default to the smallest preset that
  //     covers it; otherwise the next multiple-of-5 above the min.
  //   - With no min, default to $10.
  const initialAmount = useMemo(() => {
    if (suggestedMin <= 0) return 10;
    const ceil = roundUpToIncrement(suggestedMin);
    const matchingPreset = PRESETS.find((p) => p >= ceil);
    return matchingPreset ?? ceil;
  }, [suggestedMin]);

  const [amount, setAmount] = useState<number>(initialAmount);
  const [customInput, setCustomInput] = useState<string>('');
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser({ uid: u.uid, email: u.email });
        try {
          const snap = await getDoc(doc(firestore, 'pitchers', u.uid));
          if (snap.exists()) {
            setCurrentBalance(Number(snap.data().credit_balance) || 0);
          }
        } catch (err) {
          console.error('[Pitcher load error]', err);
        }
      } else {
        setUser(null);
      }
      setAuthResolved(true);
    });
    return () => unsubscribe();
  }, []);

  const isValidAmount = amount > 0 && amount <= 5000 && amount % INCREMENT === 0;
  const isBelowMin = suggestedMin > 0 && amount < suggestedMin;
  const customIsActive = !PRESETS.includes(amount);

  const handlePreset = (n: number) => {
    setAmount(n);
    setCustomInput('');
    setErrorMessage(null);
  };

  const handleCustomChange = (raw: string) => {
    setCustomInput(raw);
    setErrorMessage(null);
    if (!raw) return;
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed <= 0) return;
    setAmount(parsed);
  };

  const snapCustomOnBlur = () => {
    if (!customInput) return;
    const parsed = parseFloat(customInput);
    if (isNaN(parsed) || parsed <= 0) return;
    const snapped = roundUpToIncrement(parsed);
    setAmount(snapped);
    setCustomInput(String(snapped));
  };

  const createOrder = async () => {
    setErrorMessage(null);
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'capture', amount }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMessage(data.error || 'Could not start payment. Please try again.');
      throw new Error(data.error || 'create-order failed');
    }
    return data.id;
  };

  const onApprove = async (data: { orderID: string }) => {
    if (!user) {
      setErrorMessage('You are not logged in. Please refresh and try again.');
      return;
    }
    try {
      const res = await fetch('/api/complete-order-and-update-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID, intent: 'capture', pitcherId: user.uid }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error || 'PayPal completed but we could not update your balance. Contact support.');
        return;
      }
      const result = await res.json();
      if (result.status === 'COMPLETED') {
        setSuccessMessage(`✓ $${amount.toFixed(2)} added to your balance.`);
        // Refresh balance shown on this page.
        try {
          const snap = await getDoc(doc(firestore, 'pitchers', user.uid));
          if (snap.exists()) setCurrentBalance(Number(snap.data().credit_balance) || 0);
        } catch {}
        // Brief pause so the user sees the confirmation, then redirect.
        setTimeout(() => {
          router.push(readReturnPath() ?? '/pitcher/profile');
        }, 1500);
      } else {
        setErrorMessage(`PayPal status: ${result.status}. Please contact support if your card was charged.`);
      }
    } catch (err) {
      console.error('[Add-fund onApprove error]', err);
      setErrorMessage('Network error after PayPal capture. Contact support@donatalk.com');
    }
  };

  if (!authResolved) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <PageHeading>Add Funds</PageHeading>
          <PageSubheading>Loading…</PageSubheading>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (!user) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <PageHeading>Add Funds</PageHeading>
          <NotLoggedInBox>
            You need to be signed in as a pitcher to add funds.{' '}
            <a href="/login">Log in</a>.
          </NotLoggedInBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const projectedBalance = currentBalance !== null ? currentBalance + amount : null;

  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <PageHeading>Add Funds</PageHeading>
        <PageSubheading>Top up your DonaTalk balance in $5 increments</PageSubheading>

        {suggestedMin > 0 && (
          <HintBox tone="info">
            You need at least <strong>${suggestedMin.toFixed(2)}</strong> to send your request.
            Top up any amount — leftover balance stays in your account for future meetings.
          </HintBox>
        )}

        <IntroCard label="Choose an amount">
          <PresetGrid>
            {PRESETS.map((p) => (
              <PresetButton
                key={p}
                type="button"
                selected={!customIsActive && amount === p}
                onClick={() => handlePreset(p)}
              >
                ${p}
              </PresetButton>
            ))}
          </PresetGrid>

          <CustomAmountWrapper>
            Or enter a custom amount (multiples of $5)
            <CustomAmountRow>
              <Dollar>$</Dollar>
              <CustomAmountInput
                type="number"
                min={5}
                max={5000}
                step={5}
                inputMode="numeric"
                value={customInput}
                placeholder={customIsActive ? String(amount) : ''}
                onChange={(e) => handleCustomChange(e.target.value)}
                onBlur={snapCustomOnBlur}
              />
            </CustomAmountRow>
          </CustomAmountWrapper>
        </IntroCard>

        <InfoLineGroup>
          {currentBalance !== null && (
            <InfoLine label="Current balance">${currentBalance.toFixed(2)}</InfoLine>
          )}
          <InfoLine label="Adding"><strong>${amount.toFixed(2)}</strong></InfoLine>
          {projectedBalance !== null && (
            <InfoLine label="After this top-up"><strong>${projectedBalance.toFixed(2)}</strong></InfoLine>
          )}
        </InfoLineGroup>

        {isBelowMin && (
          <HintBox tone="warn">
            ${amount.toFixed(2)} won&rsquo;t be enough to send your pending request
            (you need ${suggestedMin.toFixed(2)}). You can top up anyway and add more later.
          </HintBox>
        )}

        {errorMessage && <ErrorBox style={{ marginTop: 12 }}>{errorMessage}</ErrorBox>}
        {successMessage && <SuccessBox>{successMessage}</SuccessBox>}

        {!successMessage && isValidAmount && (
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
              currency: 'USD',
              'disable-funding': 'paylater',
              ...(process.env.NEXT_PUBLIC_PAYPAL_ENV === 'sandbox' && { environment: 'sandbox' as const }),
            }}
          >
            <PayPalArea>
              <div style={{ width: '100%', maxWidth: 360 }}>
                <PayPalButtons
                  // Force re-render when amount changes so PayPal uses the latest.
                  forceReRender={[amount]}
                  createOrder={() => createOrder()}
                  onApprove={(data) => onApprove({ orderID: data.orderID })}
                  style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                />
              </div>
            </PayPalArea>
          </PayPalScriptProvider>
        )}
      </CardContainer>
    </PageWrapper>
  );
}
