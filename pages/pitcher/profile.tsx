import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/clientApp';
import Head from 'next/head';
import PageWrapper from '../../components/layout/PageWrapper';
import CardContainer from '../../components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '../../components/ui/shared';
import { styled } from '../../styles/stitches.config';
import { ClipboardCopy } from 'lucide-react';
import { Input, Button } from '../../components/ui';

const InfoRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
});

const Label = styled('div', {
  fontWeight: '600',
});

const Value = styled('div', {
  fontSize: '16px',
  color: '$dark',
});

const ShareSection = styled('div', {
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: '$lightgray',
  borderRadius: '8px',
  textAlign: 'center',
});

const SharableLinkBox = styled('div', {
  padding: '0.75rem 1rem',
  backgroundColor: '#fff',
  border: '1px solid $mediumgray',
  borderRadius: '6px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  wordBreak: 'break-all',
  marginTop: '0.75rem',
});

const CopyButton = styled('button', {
  backgroundColor: '$heart',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '0.3rem 0.6rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontSize: '14px',
  '&:hover': {
    backgroundColor: '#c0392b',
  },
});

const CopiedMessage = styled('span', {
  fontSize: '12px',
  color: 'green',
  marginLeft: '0.5rem',
});

export default function PitcherProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [pitcher, setPitcher] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [addingFund, setAddingFund] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const docRef = doc(firestore, 'pitchers', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setPitcher(docSnap.data());
          } else {
            setError('Your profile was not found. Please contact support.');
          }
        } catch (err) {
          console.error(err);
          setError('Failed to load profile. Please try again later.');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleCopy = () => {
    if (userId) {
      const shareLink = `${window.location.origin}/pitcher/${userId}`;
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleAddFund = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) return;

    setPaymentLoading(true);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(parseFloat(fundAmount) * 100), // Stripe requires cents
          pitcherId: userId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe checkout
      } else {
        alert('Error creating payment.');
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (error) {
    return (
      <PageWrapper>
        <CardContainer>
          <ErrorBox>{error}</ErrorBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (!pitcher) {
    return (
      <PageWrapper>
        <CardContainer>
          <Subtitle>Loading your profile...</Subtitle>
        </CardContainer>
      </PageWrapper>
    );
  }

  return (
    <>
      <Head>
        <title>{pitcher.fullName} | My Profile</title>
      </Head>
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>My Profile</Title>
          <Subtitle>Welcome, {pitcher.fullName}</Subtitle>

          {/* ✅ Sharable Link Section */}
          <ShareSection>
            <p>Please share the following link with your potential listeners:</p>
            <SharableLinkBox>
              <span>{`${window.location.origin}/pitcher/${userId}`}</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CopyButton onClick={handleCopy} aria-label="Copy link to clipboard">
                  <ClipboardCopy size={16} /> Copy
                </CopyButton>
                {copied && <CopiedMessage>Copied!</CopiedMessage>}
              </div>
            </SharableLinkBox>
          </ShareSection>

          {/* ✅ Profile Info */}
          <InfoRow>
            <Label>Email Address:</Label>
            <Value>{pitcher.email}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Areas of Interest:</Label>
            <Value>{pitcher.areasOfInterest}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Donation Request per Meeting ($):</Label>
            <Value>{pitcher.donation}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Credit Balance ($):</Label>
            <Value>{pitcher.credit_balance}</Value>
          </InfoRow>

          {/* ✅ Add Fund Section */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            {addingFund ? (
              <>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  style={{ maxWidth: '200px', marginBottom: '0.5rem' }}
                />
                <Button onClick={handleAddFund} disabled={paymentLoading}>
                  {paymentLoading ? 'Processing...' : 'Confirm Payment'}
                </Button>
                <Button
                  onClick={() => {
                    setAddingFund(false);
                    setFundAmount('');
                  }}
                  variant="secondary"
                  style={{ marginLeft: '0.5rem' }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setAddingFund(true)}>Add Fund</Button>
            )}
          </div>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
