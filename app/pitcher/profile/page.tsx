// app/pitcher/profile/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/clientApp';
import Head from 'next/head';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';
import { ClipboardCopy } from 'lucide-react';
import { PLATFORM_FEE_PERCENTAGE, calculateTotalWithFee } from '@/lib/constants';
import {
  PageHeading,
  PageSubheading,
  IntroCard,
  ShareLinkCard,
  InfoLine,
  InfoLineGroup,
  BalanceBreakdown,
  PrimaryCTA,
  SecondaryLink,
  linkify,
} from '@/components/ui/profileCards';

type Pitcher = {
  fullName: string;
  email: string;
  pitch: string;
  donation: number;
  credit_balance: number;
  reservedBalance?: number;
  pendingReservationCount?: number;
};

type PendingPitch = {
  id: string;
  listenerName: string;
  listenerEmail: string;
  reservedAmount: number;
  availability: string;
  reservedAt: Timestamp | null;
};

type IncomingRequest = {
  id: string;
  listenerName: string;
  listenerEmail: string;
  reservedAmount: number;
  availability: string;
  reservedAt: Timestamp | null;
};

type EscrowedMeeting = {
  id: string;
  // The other party — listener if pitcher is on this dashboard.
  listenerName: string;
  listenerEmail: string;
  escrowedAmount: number;
  acceptedAt: Timestamp | null;
  pitcherConfirmed: boolean;
  listenerConfirmed: boolean;
  role: 'pitcher' | 'listener';
};

const BalanceWarning = styled('p', {
  marginTop: '$sm',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#7a4c00',
  backgroundColor: '#fff8e1',
  border: '1px solid #ffe082',
  borderRadius: '$sm',
  textAlign: 'center',
  '& strong': { color: '#5a3700' },
});

const AddFundCTA = styled('button', {
  marginTop: '$md',
  padding: '12px 18px',
  borderRadius: '$md',
  backgroundColor: '$dark',
  color: '$white',
  border: 'none',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
  '&:hover': { backgroundColor: '#1f2d3a' },
});

const InboxSection = styled('div', {
  width: '100%',
  marginTop: '$md',
  padding: '$md',
  backgroundColor: '#f9fafb',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
});
const InboxHeader = styled('h3', {
  margin: '0 0 4px 0',
  fontSize: '$md',
  fontWeight: 600,
  color: '$dark',
});
const InboxNote = styled('p', {
  margin: '0 0 $sm',
  fontSize: '12px',
  color: '$darkgray',
});
const MeetingCard = styled('div', {
  padding: '12px',
  backgroundColor: '#fff',
  border: '1px solid #e8eaec',
  borderRadius: '$sm',
  marginBottom: '$sm',
  fontSize: '14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '$sm',
  '&:last-child': { marginBottom: 0 },
});
const MeetingCardBody = styled('div', { flex: 1 });
const MeetingMeta = styled('div', { fontSize: '12px', color: '$darkgray', marginTop: '4px' });
const CancelButton = styled('button', {
  background: '$heart', color: '#fff', border: 'none', borderRadius: '$sm',
  padding: '6px 12px', cursor: 'pointer', fontSize: '13px',
  '&:hover:not(:disabled)': { background: '#a53224' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});
const ActionRow = styled('div', { display: 'flex', gap: '$sm' });
const AcceptButton = styled('button', {
  background: '#27ae60', color: '#fff', border: 'none', borderRadius: '$sm',
  padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  '&:hover:not(:disabled)': { background: '#1e8c4a' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});
const DeclineButton = styled('button', {
  background: '$heart', color: '#fff', border: 'none', borderRadius: '$sm',
  padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  '&:hover:not(:disabled)': { background: '#a53224' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});
const NoShowButton = styled('button', {
  background: '#f39c12', color: '#fff', border: 'none', borderRadius: '$sm',
  padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
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

function firstNameOf(full: string): string {
  return (full || '').trim().split(/\s+/)[0] || full || 'you';
}

export default function PitcherProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [pitcher, setPitcher] = useState<Pitcher | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [listenerSetUp, setListenerSetUp] = useState(true);
  const [pendingPitches, setPendingPitches] = useState<PendingPitch[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [escrowed, setEscrowed] = useState<EscrowedMeeting[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [escrowActionId, setEscrowActionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchPitcherData(user.uid);
        try {
          const listenerDoc = await getDoc(doc(firestore, 'listeners', user.uid));
          if (listenerDoc.exists()) {
            setListenerSetUp(listenerDoc.data().isSetUp !== false);
          }
        } catch (err) {
          console.error('[Fetch Listener Status Error]', err);
        }
        await refreshInboxes(user.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const refreshInboxes = async (uid: string) => {
    try {
      const pendingQ = query(
        collection(firestore, 'meetings'),
        where('pitcherId', '==', uid),
        where('status', '==', 'reserved'),
        orderBy('reservedAt', 'desc'),
      );
      const pendingSnap = await getDocs(pendingQ);
      setPendingPitches(pendingSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          listenerName: data.listenerName || '(unknown)',
          listenerEmail: data.listenerEmail || '',
          reservedAmount: Number(data.reservedAmount) || 0,
          availability: data.availability || '',
          reservedAt: data.reservedAt || null,
        };
      }));
    } catch (err) {
      console.error('[Fetch Pending Pitches Error]', err);
    }
    try {
      const incomingQ = query(
        collection(firestore, 'meetings'),
        where('pitcherId', '==', uid),
        where('status', '==', 'pending'),
        orderBy('reservedAt', 'desc'),
      );
      const incomingSnap = await getDocs(incomingQ);
      setIncomingRequests(incomingSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          listenerName: data.listenerName || '(unknown)',
          listenerEmail: data.listenerEmail || '',
          reservedAmount: Number(data.reservedAmount) || 0,
          availability: data.availability || '',
          reservedAt: data.reservedAt || null,
        };
      }));
    } catch (err) {
      console.error('[Fetch Incoming Requests Error]', err);
    }
    // Escrowed meetings — accepted, awaiting completion confirmation or no-show.
    try {
      const escrowQ = query(
        collection(firestore, 'meetings'),
        where('pitcherId', '==', uid),
        where('status', '==', 'accepted'),
        orderBy('acceptedAt', 'desc'),
      );
      const escrowSnap = await getDocs(escrowQ);
      setEscrowed(escrowSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          listenerName: data.listenerName || '(unknown)',
          listenerEmail: data.listenerEmail || '',
          escrowedAmount: Number(data.escrowedAmount ?? data.reservedAmount) || 0,
          acceptedAt: data.acceptedAt || null,
          pitcherConfirmed: !!data.pitcherConfirmed,
          listenerConfirmed: !!data.listenerConfirmed,
          role: 'pitcher' as const,
        };
      }));
    } catch (err) {
      console.error('[Fetch Escrowed Error]', err);
    }
  };

  const handleRespond = async (meetingId: string, action: 'accept' | 'decline') => {
    if (!auth.currentUser || !userId) return;
    const confirmMsg =
      action === 'accept'
        ? 'Accept this listener request? Your balance will be deducted by the donation amount.'
        : 'Decline this listener request? They will be notified.';
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
        if (data.error === 'pitcher-balance-insufficient') {
          alert(`Insufficient balance — you have $${data.available?.toFixed(2)} available, $${data.required?.toFixed(2)} required. Add funds and try again.`);
        } else {
          alert(`Could not ${action}: ${data.error || res.statusText}`);
        }
      } else {
        await fetchPitcherData(userId);
        await refreshInboxes(userId);
      }
    } catch (err) {
      console.error('[Respond Error]', err);
      alert(`Network error while attempting to ${action}.`);
    } finally {
      setRespondingId(null);
    }
  };

  const handleEscrowAction = async (meetingId: string, action: 'confirm-completed' | 'report-no-show') => {
    if (!auth.currentUser || !userId) return;
    const confirmMsg =
      action === 'confirm-completed'
        ? 'Mark this meeting as completed? Once both parties confirm, the donation is treated as fulfilled.'
        : 'Report a no-show for this meeting? The escrowed donation will be refunded to your balance.';
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
        } else if (data.status === 'refunded') {
          alert(`Refund issued: $${data.refundedAmount?.toFixed(2)} returned to your balance.`);
        }
        await fetchPitcherData(userId);
        await refreshInboxes(userId);
      }
    } catch (err) {
      console.error('[Escrow Action Error]', err);
      alert(`Network error while attempting ${action}.`);
    } finally {
      setEscrowActionId(null);
    }
  };

  const handleCancel = async (meetingId: string) => {
    if (!auth.currentUser || !userId) return;
    if (!confirm('Withdraw this pitch request? The reserved balance will be released and the listener will be notified.')) return;
    setCancellingId(meetingId);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/meeting/${meetingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: '{}',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Could not cancel: ${data.error || res.statusText}`);
      } else {
        await fetchPitcherData(userId);
        await refreshInboxes(userId);
      }
    } catch (err) {
      console.error('[Cancel Pitch Error]', err);
      alert('Network error while cancelling.');
    } finally {
      setCancellingId(null);
    }
  };

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
      const e = err as Error;
      console.error('[Fetch Data Error]', e.message);
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
          <PageSubheading>Loading your profile…</PageSubheading>
        </CardContainer>
      </PageWrapper>
    );
  }

  const requiredBalance = calculateTotalWithFee(pitcher.donation);
  const reservedBalance = Number(pitcher.reservedBalance) || 0;
  const availableBalance = pitcher.credit_balance - reservedBalance;
  const isActive = availableBalance >= requiredBalance;
  const firstName = firstNameOf(pitcher.fullName);
  const shareUrl = userId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pitcher/${userId}` : '';

  return (
    <>
      <Head>
        <title>{pitcher.fullName} | My Pitcher Profile</title>
      </Head>
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <PageHeading>My Pitcher Profile</PageHeading>
          <PageSubheading>Welcome, {pitcher.fullName}</PageSubheading>

          <BalanceBreakdown
            available={availableBalance}
            reserved={reservedBalance}
            total={pitcher.credit_balance}
          />

          <InfoLineGroup>
            <InfoLine label="Donation per meeting">${pitcher.donation.toFixed(2)}</InfoLine>
            <InfoLine label="Required balance to stay active">${requiredBalance.toFixed(2)}</InfoLine>
          </InfoLineGroup>

          {!isActive && (
            <BalanceWarning>
              🚩 Your <strong>available balance</strong> must be at least <strong>${requiredBalance.toFixed(2)}</strong>{' '}
              (donation + {PLATFORM_FEE_PERCENTAGE}% process fee).
              Until then your shareable link is inactive.
            </BalanceWarning>
          )}

          <AddFundCTA onClick={() => router.push('/pitcher/add-fund')}>+ Add funds via PayPal</AddFundCTA>

          {pitcher.pitch && pitcher.pitch.trim() && (
            <IntroCard label={`${firstName}'s pitch`}>{linkify(pitcher.pitch)}</IntroCard>
          )}

          <ShareLinkCard
            hint="Share this link with your potential listeners:"
            url={shareUrl}
            copied={copied}
            onCopy={handleCopy}
            copyIcon={<ClipboardCopy size={18} />}
          />

          <InfoLineGroup>
            <InfoLine label="Email">{pitcher.email}</InfoLine>
          </InfoLineGroup>

          {pendingPitches.length > 0 && (
            <InboxSection>
              <InboxHeader>Pending pitches ({pendingPitches.length})</InboxHeader>
              <InboxNote>Waiting for the listener to accept. Cancel to release the reserved balance.</InboxNote>
              {pendingPitches.map((m) => (
                <MeetingCard key={m.id}>
                  <MeetingCardBody>
                    <div>To <strong>{m.listenerName}</strong></div>
                    <div>Reserved: <strong>${m.reservedAmount.toFixed(2)}</strong></div>
                    {m.availability && <div>Your note: &quot;{m.availability}&quot;</div>}
                    <MeetingMeta>
                      {m.listenerEmail}
                      {m.reservedAt && ` · Sent ${new Date(m.reservedAt.toMillis()).toLocaleDateString()}`}
                    </MeetingMeta>
                  </MeetingCardBody>
                  <CancelButton onClick={() => handleCancel(m.id)} disabled={cancellingId === m.id}>
                    {cancellingId === m.id ? 'Cancelling…' : 'Cancel'}
                  </CancelButton>
                </MeetingCard>
              ))}
            </InboxSection>
          )}

          {escrowed.length > 0 && (
            <InboxSection>
              <InboxHeader>Escrowed meetings ({escrowed.length})</InboxHeader>
              <InboxNote>
                The listener accepted — the donation is held until the meeting happens.
                After 30 days with no reports, the donation is treated as fulfilled.
              </InboxNote>
              {escrowed.map((m) => (
                <MeetingCard key={m.id}>
                  <MeetingCardBody>
                    <div>
                      With <strong>{m.listenerName}</strong>
                      {m.pitcherConfirmed && <EscrowBadge>You confirmed</EscrowBadge>}
                      {m.listenerConfirmed && !m.pitcherConfirmed && <EscrowBadge>Listener confirmed</EscrowBadge>}
                    </div>
                    <div>Escrowed: <strong>${m.escrowedAmount.toFixed(2)}</strong></div>
                    <MeetingMeta>
                      {m.listenerEmail}
                      {m.acceptedAt && ` · Accepted ${new Date(m.acceptedAt.toMillis()).toLocaleDateString()}`}
                    </MeetingMeta>
                  </MeetingCardBody>
                  <ActionRow>
                    {!m.pitcherConfirmed && (
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

          {incomingRequests.length > 0 && (
            <InboxSection>
              <InboxHeader>Incoming requests ({incomingRequests.length})</InboxHeader>
              <InboxNote>Listeners who want to hear your pitch.</InboxNote>
              {incomingRequests.map((m) => (
                <MeetingCard key={m.id}>
                  <MeetingCardBody>
                    <div><strong>{m.listenerName}</strong></div>
                    <div>Donation if accepted: <strong>${m.reservedAmount.toFixed(2)}</strong></div>
                    {m.availability && <div>Their note: &quot;{m.availability}&quot;</div>}
                    <MeetingMeta>
                      {m.listenerEmail}
                      {m.reservedAt && ` · Received ${new Date(m.reservedAt.toMillis()).toLocaleDateString()}`}
                    </MeetingMeta>
                  </MeetingCardBody>
                  <ActionRow>
                    <AcceptButton
                      onClick={() => handleRespond(m.id, 'accept')}
                      disabled={respondingId === m.id}
                    >
                      {respondingId === m.id ? 'Working…' : '✓ Accept'}
                    </AcceptButton>
                    <DeclineButton
                      onClick={() => handleRespond(m.id, 'decline')}
                      disabled={respondingId === m.id}
                    >
                      ✗ Decline
                    </DeclineButton>
                  </ActionRow>
                </MeetingCard>
              ))}
            </InboxSection>
          )}

          <PrimaryCTA as="button" onClick={() => router.push('/pitcher/update-profile')}>
            Edit profile →
          </PrimaryCTA>

          <div style={{ textAlign: 'center' }}>
            <SecondaryLink
              as="button"
              onClick={() => router.push(listenerSetUp ? '/listener/profile' : '/listener/update-profile')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: '8px 0' }}
            >
              {listenerSetUp ? <>Switch to <strong>Listener Profile</strong></> : <>Set up your <strong>Listener Profile</strong></>}
            </SecondaryLink>
          </div>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
