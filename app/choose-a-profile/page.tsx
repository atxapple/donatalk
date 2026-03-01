'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/clientApp';
import Head from 'next/head';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { Button } from '@/components/ui';
import { styled } from '@/styles/stitches.config';

const ButtonGroup = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  marginTop: '2rem',
});

export default function ChooseProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isPitcher, setIsPitcher] = useState(false);
  const [isListener, setIsListener] = useState(false);
  const [pitcherSetUp, setPitcherSetUp] = useState(true);
  const [listenerSetUp, setListenerSetUp] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.uid);
      try {
        const pitcherDoc = await getDoc(doc(firestore, 'pitchers', user.uid));
        const listenerDoc = await getDoc(doc(firestore, 'listeners', user.uid));

        const pitcherData = pitcherDoc.exists() ? pitcherDoc.data() : null;
        const listenerData = listenerDoc.exists() ? listenerDoc.data() : null;

        setIsPitcher(pitcherDoc.exists() && !pitcherData?.deletedAt);
        setIsListener(listenerDoc.exists() && !listenerData?.deletedAt);

        if (pitcherData && !pitcherData.deletedAt) {
          setPitcherSetUp(pitcherData.isSetUp !== false);
        }
        if (listenerData && !listenerData.deletedAt) {
          setListenerSetUp(listenerData.isSetUp !== false);
        }

        if (!pitcherDoc.exists() && !listenerDoc.exists()) {
          setError('No profile found. Please sign up as Pitcher or Listener first.');
        }
      } catch (err: any) {
        console.error('[Fetch Profile Error]', err.message);
        setError('Error loading profile data.');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <>
      <Head>
        <title>Choose Profile | DonaTalk</title>
      </Head>

      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Select Your Role</Title>
          <Subtitle>Which profile do you want to access?</Subtitle>

          {error && <ErrorBox>{error}</ErrorBox>}

          <ButtonGroup>
            {isPitcher && (
              <Button onClick={() => router.push(pitcherSetUp ? '/pitcher/profile' : '/pitcher/update-profile')}>
                {pitcherSetUp ? '🎤 Go to Pitcher Profile' : '🎤 Set Up Pitcher Profile'}
              </Button>
            )}
            {isListener && (
              <Button onClick={() => router.push(listenerSetUp ? '/listener/profile' : '/listener/update-profile')}>
                {listenerSetUp ? '👂 Go to Listener Profile' : '👂 Set Up Listener Profile'}
              </Button>
            )}
          </ButtonGroup>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
