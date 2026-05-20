// app/listener/profile/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/clientApp';
import Head from 'next/head';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';
import { ClipboardCopy } from 'lucide-react';
import { Listener } from '@/types/listener';
import {
  PageHeading,
  PageSubheading,
  IntroCard,
  StatCard,
  ShareLinkCard,
  InfoLine,
  InfoLineGroup,
  PrimaryCTA,
  SecondaryLink,
  linkify,
} from '@/components/ui/profileCards';

const InboxSection = styled('div', {
  width: '100%',
  marginTop: '$md',
  padding: '$md',
  backgroundColor: '#f9fafb',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
});
const InboxHeader = styled('h3', {
  margin: '0 0 $sm 0',
  fontSize: '$md',
  fontWeight: 600,
  color: '$dark',
});
const MeetingCard = styled('div', {
  padding: '12px',
  backgroundColor: '#fff',
  border: '1px solid #e8eaec',
  borderRadius: '$sm',
  marginBottom: '$sm',
  fontSize: '14px',
  '&:last-child': { marginBottom: 0 },
});
const MeetingMeta = styled('div', { fontSize: '12px', color: '$darkgray', marginTop: '4px' });
const ActionRow = styled('div', { display: 'flex', gap: '$sm', marginTop: '$sm' });
const AcceptButton = styled('button', {
  background: '#27ae60', color: '#fff', border: 'none', borderRadius: '$sm',
  padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  '&:hover:not(:disabled)': { background: '#1e8c4a' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});
const DeclineButton = styled('button', {
  background: '$heart', color: '#fff', border: 'none', borderRadius: '$sm',
  padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  '&:hover:not(:disabled)': { background: '#a53224' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});
const NoShowButton = styled('button', {
  background: '#f39c12', color: '#fff', border: 'none', borderRadius: '$sm',
  padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  '&:hover:not(:disabled)': { background: '#d68910' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});
const EscrowBadge = styled('span', {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 600,
  background: '#fff8e1',
  color: '#7a4c00',
  marginLeft: '$sm',
});
const MeetingCardBody = styled('div', { flex: 1 });
const InboxNote = styled('p', { margin: '0 0 $sm', fontSize: '12px', color: '$darkgray' });

type IncomingMeeting = {
  id: string;
  pitcherName: string;
  pitcherEmail: string;
  reservedAmount: number;
  availability: string;
  reservedAt: Timestamp | null;
};

type EscrowedMeeting = {
  id: string;
  pitcherName: string;
  pitcherEmail: string;
  escrowedAmount: number;
  acceptedAt: Timestamp | null;
  pitcherConfirmed: boolean;
  listenerConfirmed: boolean;
};

function firstNameOf(full: string): string {
  return (full || '').trim().split(/\s+/)[0] || full || 'you';
}

export default function ListenerProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [listener, setListener] = useState<Listener | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pitcherSetUp, setPitcherSetUp] = useState(true);
  const [incoming, setIncoming] = useState<IncomingMeeting[]>([]);
  const [escrowed, setEscrowed] = useState<EscrowedMeeting[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [escrowActionId, setEscrowActionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchListenerData(user.uid);
        try {
          const pitcherDoc = await getDoc(doc(firestore, 'pitchers', user.uid));
          if (pitcherDoc.exists()) {
            setPitcherSetUp(pitcherDoc.data().isSetUp !== false);
          }
        } catch (err) {
          console.error('[Fetch Pitcher Status Error]', err);
        }
        try {
          const q = query(
            collection(firestore, 'meetings'),
            where('listenerId', '==', user.uid),
            where('status', '==', 'reserved'),
            orderBy('reservedAt', 'desc'),
          );
          const snap = await getDocs(q);
          setIncoming(snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              pitcherName: data.pitcherName || '(unknown)',
              pitcherEmail: data.pitcherEmail || '',
              reservedAmount: Number(data.reservedAmount) || 0,
              availability: data.availability || '',
              reservedAt: data.reservedAt || null,
            };
          }));
        } catch (err) {
          console.error('[Fetch Incoming Error]', err);
        }
        // Escrowed meetings — accepted, waiting on completion or no-show report.
        try {
          const eq = query(
            collection(firestore, 'meetings'),
            where('listenerId', '==', user.uid),
            where('status', '==', 'accepted'),
            orderBy('acceptedAt', 'desc'),
          );
          const esnap = await getDocs(eq);
          setEscrowed(esnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              pitcherName: data.pitcherName || '(unknown)',
              pitcherEmail: data.pitcherEmail || '',
              escrowedAmount: Number(data.escrowedAmount ?? data.reservedAmount) || 0,
              acceptedAt: data.acceptedAt || null,
              pitcherConfirmed: !!data.pitcherConfirmed,
              listenerConfirmed: !!data.listenerConfirmed,
            };
          }));
        } catch (err) {
          console.error('[Fetch Escrowed Error]', err);
        }
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
      const e = err as Error;
      console.error('[Fetch Data Error]', e.message);
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

  const handleEscrowAction = async (meetingId: string, action: 'confirm-completed' | 'report-no-show') => {
    if (!auth.currentUser || !userId) return;
    const confirmMsg =
      action === 'confirm-completed'
        ? 'Mark this meeting as completed? Once both parties confirm, the donation is treated as fulfilled.'
        : 'Report a no-show for this meeting? The donation will be refunded to the pitcher.';
    if (!confirm(confirmMsg)) return;
    setEscrowActionId(meetingId);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/meeting/${meetingId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: '{}',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Could not ${action}: ${data.error || res.statusText}`);
      } else {
        const data = await res.json();
        if (action === 'confirm-completed' && data.status !== 'completed') {
          alert(`Confirmed. Waiting on the ${data.waitingFor} to also confirm.`);
        }
        // Remove from list optimistically.
        setEscrowed((cur) => cur.filter((m) => m.id !== meetingId));
      }
    } catch (err) {
      console.error('[Escrow Action Error]', err);
      alert(`Network error while attempting ${action}.`);
    } finally {
      setEscrowActionId(null);
    }
  };

  const respond = async (meetingId: string, action: 'accept' | 'decline') => {
    if (!auth.currentUser) return;
    const confirmMsg =
      action === 'accept'
        ? 'Accept this pitch request? The pitcher will be charged after confirmation.'
        : "Decline this pitch request? The pitcher's reservation will be released.";
    if (!confirm(confirmMsg)) return;
    setRespondingId(meetingId);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/meeting/${meetingId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Could not ${action}: ${data.error || res.statusText}`);
      } else {
        setIncoming((cur) => cur.filter((m) => m.id !== meetingId));
      }
    } catch (err) {
      console.error('[Respond Error]', err);
      alert(`Network error while attempting to ${action}.`);
    } finally {
      setRespondingId(null);
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
          <PageSubheading>Loading your profile…</PageSubheading>
        </CardContainer>
      </PageWrapper>
    );
  }

  const firstName = firstNameOf(listener.fullName);
  const shareUrl = userId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/listener/${userId}` : '';

  return (
    <>
      <Head>
        <title>{listener.fullName} | My Profile</title>
      </Head>
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <PageHeading>My Listener Profile</PageHeading>
          <PageSubheading>Welcome, {listener.fullName}</PageSubheading>

          {listener.intro && listener.intro.trim() && (
            <IntroCard label="Brief intro">{linkify(listener.intro)}</IntroCard>
          )}

          <StatCard
            icon="💝"
            amount={`$${listener.donation.toFixed(2)} per meeting`}
            caption={<>donation supports {firstName}&rsquo;s chosen non&#8209;profit</>}
          />

          <ShareLinkCard
            hint="Share this link with a potential pitcher:"
            url={shareUrl}
            copied={copied}
            onCopy={handleCopy}
            copyIcon={<ClipboardCopy size={18} />}
          />

          <InfoLineGroup>
            <InfoLine label="Email">{listener.email}</InfoLine>
          </InfoLineGroup>

          {escrowed.length > 0 && (
            <InboxSection>
              <InboxHeader>Upcoming meetings ({escrowed.length})</InboxHeader>
              <InboxNote>
                You accepted these pitches — the donation is held in escrow until the
                meeting happens. After 30 days with no reports, the donation is
                treated as fulfilled.
              </InboxNote>
              {escrowed.map((m) => (
                <MeetingCard key={m.id}>
                  <div>
                    With <strong>{m.pitcherName}</strong>
                    {m.listenerConfirmed && <EscrowBadge>You confirmed</EscrowBadge>}
                    {m.pitcherConfirmed && !m.listenerConfirmed && <EscrowBadge>Pitcher confirmed</EscrowBadge>}
                  </div>
                  <div>Donation: <strong>${m.escrowedAmount.toFixed(2)}</strong></div>
                  <MeetingMeta>
                    {m.pitcherEmail}
                    {m.acceptedAt && ` · Accepted ${new Date(m.acceptedAt.toMillis()).toLocaleDateString()}`}
                  </MeetingMeta>
                  <ActionRow>
                    {!m.listenerConfirmed && (
                      <AcceptButton
                        onClick={() => handleEscrowAction(m.id, 'confirm-completed')}
                        disabled={escrowActionId === m.id}
                      >
                        {escrowActionId === m.id ? 'Working…' : '✓ Meeting happened'}
                      </AcceptButton>
                    )}
                    <NoShowButton
                      onClick={() => handleEscrowAction(m.id, 'report-no-show')}
                      disabled={escrowActionId === m.id}
                    >
                      ⚠ No-show
                    </NoShowButton>
                  </ActionRow>
                </MeetingCard>
              ))}
            </InboxSection>
          )}

          {incoming.length > 0 && (
            <InboxSection>
              <InboxHeader>Incoming pitch requests ({incoming.length})</InboxHeader>
              {incoming.map((m) => (
                <MeetingCard key={m.id}>
                  <div><strong>{m.pitcherName}</strong> wants to pitch to you.</div>
                  <div>Reserved donation: <strong>${m.reservedAmount.toFixed(2)}</strong></div>
                  {m.availability && <div>Their note: &quot;{m.availability}&quot;</div>}
                  <MeetingMeta>
                    Pitcher email: {m.pitcherEmail}
                    {m.reservedAt && ` · Sent ${new Date(m.reservedAt.toMillis()).toLocaleDateString()}`}
                  </MeetingMeta>
                  <ActionRow>
                    <AcceptButton
                      onClick={() => respond(m.id, 'accept')}
                      disabled={respondingId === m.id}
                    >
                      {respondingId === m.id ? 'Working…' : '✓ Accept'}
                    </AcceptButton>
                    <DeclineButton
                      onClick={() => respond(m.id, 'decline')}
                      disabled={respondingId === m.id}
                    >
                      ✗ Decline
                    </DeclineButton>
                  </ActionRow>
                </MeetingCard>
              ))}
            </InboxSection>
          )}

          <PrimaryCTA as="button" onClick={() => router.push('/listener/update-profile')}>
            Edit profile →
          </PrimaryCTA>

          <div style={{ textAlign: 'center' }}>
            <SecondaryLink
              as="button"
              onClick={() => router.push(pitcherSetUp ? '/pitcher/profile' : '/pitcher/update-profile')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: '8px 0' }}
            >
              {pitcherSetUp ? <>Switch to <strong>Pitcher Profile</strong></> : <>Set up your <strong>Pitcher Profile</strong></>}
            </SecondaryLink>
          </div>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
