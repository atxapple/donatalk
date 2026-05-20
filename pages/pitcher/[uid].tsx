// pages/pitcher/[uid].tsx

import { GetServerSideProps } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firestore } from '../../firebase/clientApp';
import { styled } from '../../styles/stitches.config';
import PageWrapper from '../../components/layout/PageWrapper';
import CardContainer from '../../components/layout/CardContainer';
import { Logo, InfoBox } from '../../components/ui/shared';
import { Input } from '../../components/ui';
import {
  IntroCard,
  StatCard,
  linkify,
  PrimaryCTA,
  SecondaryLink,
  SecondaryHint,
  PageHeading,
  PageSubheading,
  SelfVisitBanner,
} from '../../components/ui/profileCards';
import { useEffect, useState } from 'react';
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
  alignItems: 'stretch',
  gap: '$sm',
  width: '100%',
  marginTop: '$md',
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

const InputStyled = styled(Input, { width: '100%' });

const SubmitButton = styled('button', {
  marginTop: '$sm',
  padding: '14px 20px',
  borderRadius: '$md',
  backgroundColor: '$heart',
  color: '$white',
  border: 'none',
  fontSize: '$md',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  '&:hover:not(:disabled)': { backgroundColor: '#d63828' },
  '&:disabled': { backgroundColor: '#bbb', cursor: 'not-allowed' },
});

const FootNote = styled('p', {
  marginTop: '$lg',
  fontSize: '13px',
  color: '$darkgray',
  textAlign: 'center',
  '& a': { color: '$heart', textDecoration: 'underline' },
});

function firstNameOf(full: string): string {
  return (full || '').trim().split(/\s+/)[0] || full || 'them';
}

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

  // Narrowed alias so nested helper components keep the non-null type.
  const p: Pitcher = pitcher;
  const requiredBalance = calculateTotalWithFee(p.donation);
  const isSelfVisit = authResolved && user && user.uid === uid;
  const credit = Number(p.credit_balance) || 0;
  const reserved = Number((p as unknown as { reservedBalance?: number }).reservedBalance) || 0;
  const pitcherAvailableBalance = credit - reserved;
  const isActive = pitcherAvailableBalance >= requiredBalance;
  const firstName = firstNameOf(p.fullName);

  function Header() {
    return (
      <>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <PageHeading>{p.fullName}</PageHeading>
        <PageSubheading>on DonaTalk</PageSubheading>
      </>
    );
  }

  function PitchCard() {
    if (!p.pitch || !p.pitch.trim()) return null;
    return <IntroCard label={`${firstName}'s pitch`}>{linkify(p.pitch)}</IntroCard>;
  }

  // P1b: pitcher's link inactive (insufficient available balance)
  if (!isActive) {
    return (
      <PageWrapper>
        <CardContainer>
          <Header />
          <InfoBox>
            ℹ️ This link is currently inactive because the pitcher&rsquo;s available balance is not sufficient
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
          <Header />
          <PageSubheading>Loading…</PageSubheading>
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
          <Header />
          <PitchCard />
          <StatCard
            icon="🎁"
            amount={`$${p.donation.toFixed(2)} donation`}
            caption={<>{firstName} will donate to a non&#8209;profit of your choice after the meeting</>}
          />
          <SecondaryHint>Want to hear {firstName}&rsquo;s pitch?</SecondaryHint>
          <PrimaryCTA href={`/listener/signup?return=${encodeURIComponent(returnTo)}`}>
            Sign up as Listener →
          </PrimaryCTA>
          <div style={{ textAlign: 'center' }}>
            <SecondaryLink href={`/login?return=${encodeURIComponent(returnTo)}`}>
              Already have an account? <strong>Log in</strong>
            </SecondaryLink>
          </div>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (!viewer && !viewerLoadError) {
    return (
      <PageWrapper>
        <CardContainer>
          <Header />
          <PageSubheading>Loading your profile…</PageSubheading>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (viewerLoadError) {
    return (
      <PageWrapper>
        <CardContainer>
          <Header />
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
          <Header />
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
          <Header />
          <PitchCard />
          <SecondaryHint>Finish setting up your Listener profile to send a meeting request.</SecondaryHint>
          <PrimaryCTA href={`/listener/update-profile?return=${encodeURIComponent(returnTo)}`}>
            Set up Listener Profile →
          </PrimaryCTA>
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
        setSubmitMessage(`Request sent — ${firstName} has been notified by email.`);
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
        <Header />
        {isSelfVisit && (
          <SelfVisitBanner>
            👁️ You&rsquo;re viewing your own page as a visitor.{' '}
            <a href="/pitcher/profile">Go to your dashboard →</a>
          </SelfVisitBanner>
        )}
        <PitchCard />
        <StatCard
          icon="🎁"
          amount={`$${p.donation.toFixed(2)} donation`}
          caption={<>{firstName} will donate to a non&#8209;profit of your choice after the meeting</>}
        />
        <SecondaryHint>
          {firstName} will only commit the donation once they accept your meeting request.
        </SecondaryHint>
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
          <SubmitButton
            type="submit"
            disabled={
              !!isSelfVisit ||
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
                  : 'Send meeting request →'}
          </SubmitButton>
          {submitMessage && (
            <p style={{ marginTop: '0.5rem', color: submitState === 'success' ? 'green' : '#c0392b', textAlign: 'center' }}>
              {submitMessage}
            </p>
          )}
        </Form>
        <FootNote>
          New to DonaTalk?{' '}
          <a href="https://donatalk.com" target="_blank" rel="noopener noreferrer">
            Learn how it works ❤
          </a>
        </FootNote>
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
