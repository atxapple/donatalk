// app/listener/profile/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // ✅ Updated here
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
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
const InboxSection = styled('div', { marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' });
const InboxHeader = styled('h3', { margin: '0 0 0.75rem 0', fontSize: '16px', fontWeight: '600' });
const MeetingCard = styled('div', { padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '14px' });
const MeetingMeta = styled('div', { fontSize: '12px', color: '#666', marginTop: '0.25rem' });
const ActionRow = styled('div', { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' });
const AcceptButton = styled('button', {
  background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px',
  padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  '&:hover': { background: '#1e8c4a' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});
const DeclineButton = styled('button', {
  background: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px',
  padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
  '&:hover': { background: '#a53224' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});

type IncomingMeeting = {
  id: string;
  pitcherName: string;
  pitcherEmail: string;
  reservedAmount: number;
  availability: string;
  reservedAt: Timestamp | null;
};

export default function ListenerProfile() {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [listener, setListener] = useState<Listener | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pitcherSetUp, setPitcherSetUp] = useState(true);
  const [incoming, setIncoming] = useState<IncomingMeeting[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchListenerData(user.uid);
        // Fetch pitcher isSetUp status for cross-role button
        try {
          const pitcherDoc = await getDoc(doc(firestore, 'pitchers', user.uid));
          if (pitcherDoc.exists()) {
            setPitcherSetUp(pitcherDoc.data().isSetUp !== false);
          }
        } catch (err) {
          console.error('[Fetch Pitcher Status Error]', err);
        }
        // Fetch incoming pitch requests
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
        // Refetch the inbox to reflect the new state.
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
          <Title>My Listener Profile</Title>
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

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0rem' }}>
            <Button onClick={() => router.push('/listener/update-profile')}>Edit Profile</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <Button onClick={() => router.push(pitcherSetUp ? '/pitcher/profile' : '/pitcher/update-profile')}>
              {pitcherSetUp ? 'Go to Pitcher Profile' : 'Set Up Pitcher Profile'}
            </Button>
          </div>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
