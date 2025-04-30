// app/listener/profile/page.tsx

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
import {Listener} from '@/types/listener'

const InfoRow = styled('div', { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' });
const Label = styled('div', { fontWeight: '600' });
const Value = styled('div', { fontSize: '16px', color: '$dark' });
const ShareSection = styled('div', { marginTop: '0.5rem', padding: '1rem', backgroundColor: '$lightgray', borderRadius: '8px', textAlign: 'center' });
const SharableLink = styled('div', { fontSize: '14px', wordBreak: 'break-all', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px dashed #ccc', borderRadius: '6px', backgroundColor: '#f9f9f9' });
const CopyButton = styled('button', { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', '&:hover': { color: '$heart' } });
const AddFundSection = styled('div', { marginTop: '0.5rem', textAlign: 'center' });
const AddFundButton = styled(Button, { marginTop: '0.25rem' });

export default function ListenerProfile() {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [listener, setListener] = useState<Listener | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchListenerData(user.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchListenerData = async (uid: string) => {
    try {
      const docRef = doc(firestore, 'listeners', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setListener(docSnap.data() as Listener);
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
      const shareLink = `${window.location.origin}/listener/${userId}`;
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
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

  if (!listener) {
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
        <title>{listener.fullName} | My Profile</title>
      </Head>
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>My Profile</Title>
          <Subtitle>Welcome, {listener.fullName}</Subtitle>

          <ShareSection>
            <p>Please share the following link with a potential pitcher:</p>
            <SharableLink>
              {`${window.location.origin}/listener/${userId}`}
              <CopyButton onClick={handleCopy} aria-label="Copy link to clipboard">
                <ClipboardCopy size={18} />
              </CopyButton>
              {copied && <span style={{ fontSize: '12px', color: 'green' }}>Copied!</span>}
            </SharableLink>
          </ShareSection>

          <InfoRow>
            <Label>Email Address:</Label>
            <Value>{listener.email}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Donation per Meeting ($):</Label>
            <Value>{listener.donation.toFixed(2)}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Brief Intro or LinkedIn Page Link:</Label>
          </InfoRow>

          <Subtitle>{listener.intro}</Subtitle>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0rem' }}>
            <Button onClick={() => router.push('/listener/update-profile')}>Edit Profile</Button>
          </div>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
