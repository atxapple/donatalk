'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // ✅ Updated here
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/clientApp';
import Head from 'next/head';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { Input, Button } from '@/components/ui';
import { styled } from '@/styles/stitches.config';
import { ClipboardCopy } from 'lucide-react';

type Pitcher = {
  fullName: string;
  email: string;
  pitch: string;
  donation: number;
  credit_balance: number;
};

const InfoRow = styled('div', { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' });
const Label = styled('div', { fontWeight: '600' });
const Value = styled('div', { fontSize: '16px', color: '$dark' });
const ShareSection = styled('div', { marginTop: '0.5rem', padding: '1rem', backgroundColor: '$lightgray', borderRadius: '8px', textAlign: 'center' });
const SharableLink = styled('div', { fontSize: '14px', wordBreak: 'break-all', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px dashed #ccc', borderRadius: '6px', backgroundColor: '#f9f9f9' });
const CopyButton = styled('button', { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', '&:hover': { color: '$heart' } });
const AddFundSection = styled('div', { marginTop: '0.5rem', textAlign: 'center' });
const AddFundButton = styled(Button, { marginTop: '0.25rem' });

export default function PitcherProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();                     // ✅ Updated
  const [userId, setUserId] = useState<string | null>(null);
  const [pitcher, setPitcher] = useState<Pitcher | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showFundInput, setShowFundInput] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
    try {
      const docRef = doc(firestore, 'pitchers', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPitcher(docSnap.data() as Pitcher);
      } else {
        setError('Your profile was not found. Please contact support.');
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

  // const handleAddFund = async () => {
  //   if (!fundAmount || parseFloat(fundAmount) <= 0 || !userId) {
  //     alert('Please enter a valid fund amount.');
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     const res = await fetch('/api/create-payment-intent', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         amount: Math.round(parseFloat(fundAmount) * 100),
  //         pitcherId: userId,
  //       }),
  //     });
  //     const data = await res.json();
  //     if (data.url) {
  //       window.location.href = data.url;
  //     } else {
  //       alert('Payment error. Please try again.');
  //     }
  //   } catch (err: unknown) {
  //     const error = err as Error;
  //     console.error('[Add Fund Error]', error.message);
  //     alert('Error processing payment.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAddFund = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      alert('Please enter a valid fund amount.');
      return;
    }
    router.push(`/checkout?amount=${fundAmount}`);
  };

  useEffect(() => {
    if (searchParams?.get('payment') === 'success' && userId) {
      fetchPitcherData(userId);
    }
  }, [searchParams, userId]);

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

  const requiredBalance = Math.ceil(pitcher.donation * 1.125 * 100) / 100;

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
            <Value>{pitcher.credit_balance.toFixed(2)}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Donation per Meeting ($):</Label>
            <Value>{pitcher.donation.toFixed(2)}</Value>
          </InfoRow>

          <p style={{ marginTop: '0.0rem', color: '#333', fontSize: '16px', textAlign: 'center' }}>
            <span style={{ color: '#e74c3c', marginRight: '0.3rem' }}>🚩</span>
            Fund balance must be at least
            <strong> ${requiredBalance.toFixed(2)} </strong>
            (Donation amount + 12.5% process fee including tax),
            or your shareable link will be inactive.
          </p>

          <AddFundSection>
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
            <Label>About Pitch:</Label>
            <Value>{pitcher.pitch}</Value>
          </InfoRow>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0rem' }}>
            <Button onClick={() => router.push('/pitcher/update-profile')}>Edit Profile</Button>
          </div>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
