// pages/listener/[uid].tsx

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
import { Listener } from '@/types/listener';
import { calculateTotalWithFee, MAX_PENDING_RESERVATIONS } from '@/lib/constants';

type PitcherViewerState = {
  fullName: string;
  email: string;
  isSetUp: boolean;
  deletedAt: unknown;
  credit_balance: number;
  reservedBalance: number;
  pendingReservationCount: number;
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

export default function ListenerPage({ listener, uid }: { listener: Listener | null; uid: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [viewer, setViewer] = useState<PitcherViewerState | null>(null);
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
        const pitcherRef = doc(firestore, 'pitchers', user.uid);
        const snap = await getDoc(pitcherRef);
        if (cancelled) return;
        if (!snap.exists()) {
          // Orphan: attempt auto-recovery via both-stubs (state L4).
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
          const retry = await getDoc(pitcherRef);
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
            credit_balance: Number(data.credit_balance) || 0,
            reservedBalance: Number(data.reservedBalance) || 0,
            pendingReservationCount: Number(data.pendingReservationCount) || 0,
          });
          return;
        }
        const data = snap.data();
        setViewer({
          fullName: data.fullName || user.displayName || '',
          email: data.email || user.email || '',
          isSetUp: data.isSetUp !== false,
          deletedAt: data.deletedAt,
          credit_balance: Number(data.credit_balance) || 0,
          reservedBalance: Number(data.reservedBalance) || 0,
          pendingReservationCount: Number(data.pendingReservationCount) || 0,
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

  // L0: listener doc missing
  if (!listener) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <InfoBox>Listener not found.</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  // L1: listener not available
  const listenerAvailable = listener.isSetUp !== false && !listener.deletedAt;
  if (!listenerAvailable) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <InfoBox>This profile is not yet available.</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const requiredBalance = calculateTotalWithFee(listener.donation);
  const isSelfVisit = authResolved && user && user.uid === uid;

  // Wait for auth state to resolve before showing gated content
  if (!authResolved) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{listener.fullName} on DonaTalk</Title>
          <Subtitle>Loading…</Subtitle>
        </CardContainer>
      </PageWrapper>
    );
  }

  // L3: anonymous gate
  if (!user) {
    const returnTo = `/listener/${uid}`;
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{listener.fullName} on DonaTalk</Title>
          <Subtitle>The brief intro or LinkedIn page of {listener.fullName}: <br /> {listener.intro}</Subtitle>
          <Subtitle>
            {listener.fullName} expects a <strong>${listener.donation.toFixed(2)}</strong> donation per meeting,
            which will support a non-profit of their choice.
          </Subtitle>
          <Subtitle>Sign up as a Pitcher to talk to {listener.fullName}.</Subtitle>
          <ButtonRow>
            <Link href={`/pitcher/signup?return=${encodeURIComponent(returnTo)}`}>
              <Button>Sign up as Pitcher</Button>
            </Link>
            <Link href={`/login?return=${encodeURIComponent(returnTo)}`}>
              <Button>Log in</Button>
            </Link>
          </ButtonRow>
        </CardContainer>
      </PageWrapper>
    );
  }

  // Loading viewer state (user known, pitcher doc fetch in progress)
  if (!viewer && !viewerLoadError) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{listener.fullName} on DonaTalk</Title>
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
          <Title>{listener.fullName} on DonaTalk</Title>
          <InfoBox>{viewerLoadError}</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const v = viewer!;
  const available = v.credit_balance - v.reservedBalance;
  const returnTo = `/listener/${uid}`;

  // L6: visitor's pitcher profile soft-deleted
  if (v.deletedAt) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{listener.fullName} on DonaTalk</Title>
          <InfoBox>
            Your Pitcher profile was removed by an admin. Please contact{' '}
            <a href="mailto:support@donatalk.com">support@donatalk.com</a>.
          </InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  // L5: visitor's pitcher profile is a stub
  if (!v.isSetUp) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{listener.fullName} on DonaTalk</Title>
          <Subtitle>
            Finish setting up your Pitcher profile to send a meeting request to {listener.fullName}.
          </Subtitle>
          <Link href={`/pitcher/update-profile?return=${encodeURIComponent(returnTo)}`}>
            <Button>Set up Pitcher Profile</Button>
          </Link>
        </CardContainer>
      </PageWrapper>
    );
  }

  // L9: pending-reservation cap reached
  if (v.pendingReservationCount >= MAX_PENDING_RESERVATIONS && !isSelfVisit) {
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{listener.fullName} on DonaTalk</Title>
          <InfoBox>
            You have {MAX_PENDING_RESERVATIONS} pending pitches awaiting listener response.
            Cancel one from your profile dashboard before sending another.
          </InfoBox>
          <Link href="/pitcher/profile"><Button>Go to Dashboard</Button></Link>
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
      const res = await fetch('/api/book-meeting-from-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listenerId: uid, availability: message, idempotencyKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitState('success');
        setSubmitMessage(`Reserved $${data.reservedAmount.toFixed(2)} — ${listener.fullName} has been notified by email.`);
        setMessage('');
      } else if (res.status === 409 && data.code === 'insufficient-balance') {
        setSubmitState('error');
        setSubmitMessage(`Insufficient balance ($${data.available?.toFixed(2)} available, $${data.required?.toFixed(2)} needed). Add funds to continue.`);
      } else {
        setSubmitState('error');
        setSubmitMessage(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('[Book Meeting Error]', err);
      setSubmitState('error');
      setSubmitMessage('Network error. Please try again.');
    }
  };

  // L7: insufficient available balance
  if (available < requiredBalance && !isSelfVisit) {
    const encodedAmount = (requiredBalance - available) * 7900;
    return (
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>{listener.fullName} on DonaTalk</Title>
          <Subtitle>
            {listener.fullName} expects a <strong>${listener.donation.toFixed(2)}</strong> donation,
            which means <strong>${requiredBalance.toFixed(2)}</strong> needs to be available in your balance.
          </Subtitle>
          <InfoBox>
            Your available balance is <strong>${available.toFixed(2)}</strong>.
            Add funds to send a request.
          </InfoBox>
          <Link href={`/pitcher/add-fund?a=${encodedAmount}&return=${encodeURIComponent(returnTo)}`}>
            <Button>Add Funds</Button>
          </Link>
        </CardContainer>
      </PageWrapper>
    );
  }

  // L8 (and L2 self-visit): bookable form
  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <Title>{listener.fullName} on DonaTalk</Title>
        {isSelfVisit && (
          <Banner>
            👁️ You're viewing your own page as a visitor.{' '}
            <Link href="/listener/profile">Go to your dashboard →</Link>
          </Banner>
        )}
        <Subtitle>🙏 Thanks for your interest in pitching to {listener.fullName}.</Subtitle>
        <Subtitle>The brief intro or LinkedIn page of {listener.fullName}: <br /> {listener.intro}</Subtitle>
        <Subtitle>
          Booking this meeting will reserve <strong>${requiredBalance.toFixed(2)}</strong> from your balance.
          The <strong>${listener.donation.toFixed(2)}</strong> donation only commits once {listener.fullName} accepts.
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
                  : `Book meeting — uses $${requiredBalance.toFixed(2)} from your balance`}
          </Button>
          {submitMessage && (
            <p style={{ marginTop: '0.5rem', color: submitState === 'success' ? 'green' : '#c0392b', textAlign: 'center' }}>
              {submitMessage}
            </p>
          )}
        </Form>
        <Subtitle style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          ❗Want to make an effective pitch?{' '}
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
    const docRef = doc(firestore, 'listeners', uid as string);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { props: { listener: null, uid: uid as string } };
    }

    const data = docSnap.data();
    return {
      props: { listener: JSON.parse(JSON.stringify(data)) as Listener, uid: uid as string },
    };
  } catch {
    return { props: { listener: null, uid: uid as string } };
  }
};
