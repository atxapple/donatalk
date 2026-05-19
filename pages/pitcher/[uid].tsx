// pages/pitcher/[uid].tsx

import { GetServerSideProps } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firestore } from '../../firebase/clientApp';
import { styled } from '../../styles/stitches.config';
import PageWrapper from '../../components/layout/PageWrapper';
import CardContainer from '../../components/layout/CardContainer';
import { Logo, Title, Subtitle, InfoBox } from '../../components/ui/shared';
import { Input, Button } from '../../components/ui';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pitcher } from '@/types/pitcher';
import { calculateTotalWithFee } from '@/lib/constants';

type ListenerViewerState = {
  fullName: string;
  email: string;
  isSetUp: boolean;
  deletedAt: unknown;
};

const Form = styled('form', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '$sm',
  width: '100%',
  maxWidth: '550px',
});

const Textarea = styled('textarea', {
  padding: '$sm',
  fontSize: '$base',
  fontFamily: 'inherit',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  width: '100%',
  resize: 'vertical',
  '&::placeholder': { fontFamily: 'inherit', fontSize: '$base' },
  '&:focus': { borderColor: '$heart', outline: 'none' },
});

const InputStyled = styled(Input, {
  width: '100%',
});

const Banner = styled('div', {
  width: '100%',
  padding: '0.75rem 1rem',
  backgroundColor: '#fff8e1',
  border: '1px solid #ffe082',
  borderRadius: '8px',
  marginBottom: '1rem',
  textAlign: 'center',
  fontSize: '14px',
  color: '#665',
});

const ButtonRow = styled('div', {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '1rem',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

export default function PitcherPage({ pitcher, uid }: { pitcher: Pitcher | null; uid: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [viewer, setViewer] = useState<ListenerViewerState | null>(null);
  const [viewerLoadError, setViewerLoadError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadViewer() {
      if (!user) {
        setViewer(null);
        return;
      }
      try {
        const ref = doc(firestore, 'listeners', user.uid);
        const snap = await getDoc(ref);
        if (cancelled) return;
        if (!snap.exists()) {
          await fetch('/api/create-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              fullName: user.displayName || '',
              email: user.email || '',
              role: 'both-stubs',
            }),
          });
          const retry = await getDoc(ref);
          if (cancelled) return;
          if (!retry.exists()) {
            setViewerLoadError('Could not load your profile. Please contact support@donatalk.com');
            return;
          }
          const data = retry.data();
          setViewer({
            fullName: data.fullName || user.displayName || '',
            email: data.email || user.email || '',
            isSetUp: data.isSetUp !== false,
            deletedAt: data.deletedAt,
          });
          return;
        }
        const data = snap.data();
        setViewer({
          fullName: data.fullName || user.displayName || '',
          email: data.email || user.email || '',
          isSetUp: data.isSetUp !== false,
          deletedAt: data.deletedAt,
        });
      } catch (err) {
        if (cancelled) return;
        console.error('[Viewer Load Error]', err);
        setViewerLoadError('Could not load your profile. Please refresh.');
      }
    }
    loadViewer();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (viewer) {
      setName(viewer.fullName);
      setEmail(viewer.email);
    }
  }, [viewer]);

  if (!hydrated) return null;

  // P0: pitcher doc missing
  if (!pitcher) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <InfoBox>Pitcher not found.</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  // P1a: pitcher not set up or soft-deleted
  const pitcherAvailable = pitcher.isSetUp !== false && !pitcher.deletedAt;
  if (!pitcherAvailable) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <InfoBox>This profile is not yet available.</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const requiredBalance = calculateTotalWithFee(pitcher.donation);
  const isSelfVisit = authResolved && user && user.uid === uid;
  const credit = Number(pitcher.credit_balance) || 0;
  const reserved = Number((pitcher as unknown as { reservedBalance?: number }).reservedBalance) || 0;
  const pitcherAvailableBalance = credit - reserved;
  const isActive = pitcherAvailableBalance >= requiredBalance;

  // P1b: pitcher's link inactive (insufficient available balance)
  if (!isActive) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{pitcher.fullName} on DonaTalk</Title>
          <InfoBox>
            ℹ️ This link is currently inactive because the pitcher's available balance is not sufficient
            to cover the donation and processing fee.
          </InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (!authResolved) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{pitcher.fullName} on DonaTalk</Title>
          <Subtitle>Loading…</Subtitle>
        </CardContainer>
      </PageWrapper>
    );
  }

  // P3: anonymous gate
  if (!user) {
    const returnTo = `/pitcher/${uid}`;
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{pitcher.fullName} on DonaTalk</Title>
          <Subtitle>The pitch is about — &quot;{pitcher.pitch}&quot;</Subtitle>
          <Subtitle>
            {pitcher.fullName} will donate <strong>${pitcher.donation.toFixed(2)}</strong> to a non-profit
            of your choice after the meeting.
          </Subtitle>
          <Subtitle>Sign up as a Listener to hear {pitcher.fullName}'s pitch.</Subtitle>
          <ButtonRow>
            <Link href={`/listener/signup?return=${encodeURIComponent(returnTo)}`}>
              <Button>Sign up as Listener</Button>
            </Link>
            <Link href={`/login?return=${encodeURIComponent(returnTo)}`}>
              <Button>Log in</Button>
            </Link>
          </ButtonRow>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (!viewer && !viewerLoadError) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{pitcher.fullName} on DonaTalk</Title>
          <Subtitle>Loading your profile…</Subtitle>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (viewerLoadError) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{pitcher.fullName} on DonaTalk</Title>
          <InfoBox>{viewerLoadError}</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const v = viewer!;
  const returnTo = `/pitcher/${uid}`;

  // P6: visitor's listener profile soft-deleted
  if (v.deletedAt) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{pitcher.fullName} on DonaTalk</Title>
          <InfoBox>
            Your Listener profile was removed by an admin. Please contact{' '}
            <a href="mailto:support@donatalk.com">support@donatalk.com</a>.
          </InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  // P5: visitor's listener profile is a stub
  if (!v.isSetUp) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{pitcher.fullName} on DonaTalk</Title>
          <Subtitle>
            Finish setting up your Listener profile to send a meeting request to {pitcher.fullName}.
          </Subtitle>
          <Link href={`/listener/update-profile?return=${encodeURIComponent(returnTo)}`}>
            <Button>Set up Listener Profile</Button>
          </Link>
        </CardContainer>
      </PageWrapper>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelfVisit) return;
    setSubmitState('loading');
    setSubmitMessage('');
    try {
      const token = await user.getIdToken();
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${user.uid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await fetch('/api/request-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pitcherId: uid, availability: message, idempotencyKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitState('success');
        setSubmitMessage(`Request sent — ${pitcher.fullName} has been notified by email.`);
        setMessage('');
      } else {
        setSubmitState('error');
        setSubmitMessage(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('[Request Meeting Error]', err);
      setSubmitState('error');
      setSubmitMessage('Network error. Please try again.');
    }
  };

  // P7 (and P2 self-visit): bookable form
  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <Title>{pitcher.fullName} on DonaTalk</Title>
        {isSelfVisit && (
          <Banner>
            👁️ You're viewing your own page as a visitor.{' '}
            <Link href="/pitcher/profile">Go to your dashboard →</Link>
          </Banner>
        )}
        <Subtitle>🙏 Thanks for your interest in listening to {pitcher.fullName}&rsquo;s story.</Subtitle>
        <Subtitle>The pitch is about — &quot;{pitcher.pitch}&quot;</Subtitle>
        <Subtitle>
          {pitcher.fullName} will donate <strong>${pitcher.donation.toFixed(2)}</strong> to support your favorite
          non-profit organization after the meeting.
        </Subtitle>
        <Form onSubmit={handleSubmit}>
          <InputStyled
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <InputStyled
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="Available times or message (e.g., 'Mon 2-5pm' or Calendly link)"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <Button
            type="submit"
            disabled={
              isSelfVisit ||
              submitState === 'loading' ||
              submitState === 'success' ||
              !message.trim()
            }
          >
            {isSelfVisit
              ? 'Disabled — this is your page'
              : submitState === 'loading'
                ? 'Sending…'
                : submitState === 'success'
                  ? 'Request sent ✓'
                  : 'Send meeting request'}
          </Button>
          {submitMessage && (
            <p style={{ marginTop: '0.5rem', color: submitState === 'success' ? 'green' : '#c0392b', textAlign: 'center' }}>
              {submitMessage}
            </p>
          )}
        </Form>
        <Subtitle style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          ❗Listen to a pitch with donation{' '}
          <a href="https://donatalk.com" target="_blank" rel="noopener noreferrer">
            🙏Click here, DonaTalk❤️.
          </a>
        </Subtitle>
      </CardContainer>
    </PageWrapper>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { uid } = context.query;

  try {
    const docRef = doc(firestore, 'pitchers', uid as string);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { props: { pitcher: null, uid: uid as string } };
    }

    const data = docSnap.data();
    return {
      props: { pitcher: JSON.parse(JSON.stringify(data)) as Pitcher, uid: uid as string },
    };
  } catch {
    return { props: { pitcher: null, uid: uid as string } };
  }
};
