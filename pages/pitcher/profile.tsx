/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/clientApp';
import Head from 'next/head';
import PageWrapper from '../../components/layout/PageWrapper';
import CardContainer from '../../components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '../../components/ui/shared';
import { Input, Button } from '../../components/ui';
import { styled } from '../../styles/stitches.config';
import { ClipboardCopy } from 'lucide-react';

type Pitcher = {
  fullName: string;
  email: string;
  areasOfInterest: string;
  donation: number;
  credit_balance: number;
};

const InfoRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.75rem',
});

const Label = styled('div', {
  fontWeight: '600',
});

const Value = styled('div', {
  fontSize: '16px',
  color: '$dark',
});

const ShareSection = styled('div', {
  marginTop: '0.75rem',
  padding: '1rem',
  backgroundColor: '$lightgray',
  borderRadius: '8px',
  textAlign: 'center',
});

const SharableLink = styled('div', {
  fontSize: '14px',
  wordBreak: 'break-all',
  marginTop: '0.5rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  border: '1px dashed #ccc',
  borderRadius: '6px',
  backgroundColor: '#f9f9f9',
});

const CopyButton = styled('button', {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.25rem',
  '&:hover': {
    color: '$heart',
  },
});

const AddFundSection = styled('div', {
  marginTop: '0.5rem',
  textAlign: 'center',
});

const AddFundButton = styled(Button, {
  marginTop: '0.25rem',
});

export default function PitcherProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [pitcher, setPitcher] = useState<Pitcher | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showFundInput, setShowFundInput] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.debug('[Auth Check] User detected:', user?.uid);
      if (user) {
        setUserId(user.uid);
        await fetchPitcherData(user.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchPitcherData = async (uid: string) => {
    console.debug('[Fetch Data] Fetching data for user ID:', uid);
    try {
      const docRef = doc(firestore, 'pitchers', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const pitcherData = docSnap.data() as Pitcher;
        console.debug('[Fetch Data] Fetched pitcher data:', pitcherData);
        setPitcher(pitcherData);
      } else {
        setError('Your profile was not found. Please contact support.');
        console.error('[Fetch Data] No document found for UID:', uid);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Fetch Data Error]', error.message);
      setError('Failed to load profile. Please try again later.');
    }
  };

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
    if (!fundAmount || parseFloat(fundAmount) <= 0 || !userId) {
      alert('Please enter a valid fund amount.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(parseFloat(fundAmount) * 100),
          pitcherId: userId,
        }),
      });
      const data = await res.json();
      console.debug('[Add Fund] Payment Intent Response:', data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Payment error. Please try again.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Add Fund Error]', error.message);
      alert('Error processing payment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.query.payment === 'success' && userId) {
      console.debug('[Payment Success Detected] Refreshing profile data...');
      fetchPitcherData(userId);
    } else {
      console.debug('[Payment Check] No success flag or missing userId:', router.query.payment, userId);
    }
  }, [router.query.payment, userId]);

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

  const isFundLow = pitcher.credit_balance < pitcher.donation;

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

          <InfoRow>
            <Label>Current Fund Balance ($):</Label>
            <Value>{pitcher.credit_balance || 0}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Donation per Meeting ($):</Label>
            <Value>{pitcher.donation}</Value>
          </InfoRow>

          <AddFundSection>
            <Subtitle>Add Fund to Your Credit Balance</Subtitle>
            {!showFundInput ? (
              <AddFundButton onClick={() => setShowFundInput(true)}>Add Fund</AddFundButton>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
                <Input
                  type="number"
                  placeholder="Enter amount ($)"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="0"
                />
                <Button onClick={handleAddFund} disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm Fund'}
                </Button>
                <Button onClick={() => { setShowFundInput(false); setFundAmount(''); }}>
                  Cancel
                </Button>
              </div>
            )}
          </AddFundSection>

          <ShareSection>
            <p>Please share the following link with your potential listeners:</p>
            {isFundLow && (
              <p style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: '0.5rem' }}>
                ⚠️ Your shareable link will be inactive if your available fund is smaller than your donation amount.
              </p>
            )}
            <SharableLink>
              {`${window.location.origin}/pitcher/${userId}`}
              <CopyButton onClick={handleCopy} aria-label="Copy link to clipboard">
                <ClipboardCopy size={18} />
              </CopyButton>
              {copied && <span style={{ fontSize: '12px', color: 'green' }}>Copied!</span>}
            </SharableLink>
          </ShareSection>

          <InfoRow>
            <Label>Email Address:</Label>
            <Value>{pitcher.email}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Areas of Interest:</Label>
            <Value>{pitcher.areasOfInterest}</Value>
          </InfoRow>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
