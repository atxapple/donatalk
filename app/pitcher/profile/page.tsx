// app/pitcher/profile/page.tsx

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
import { PLATFORM_FEE_PERCENTAGE, PLATFORM_FEE_MULTIPLIER, calculateTotalWithFee } from '@/lib/constants';

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
const MeetingCard = styled('div', { padding: '0.75rem', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' });
const MeetingCardBody = styled('div', { flex: 1 });
const MeetingMeta = styled('div', { fontSize: '12px', color: '#666', marginTop: '0.25rem' });
const CancelButton = styled('button', {
  background: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px',
  padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '13px',
  '&:hover': { background: '#a53224' },
  '&:disabled': { background: '#888', cursor: 'not-allowed' },
});

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
  const [listenerSetUp, setListenerSetUp] = useState(true);
  const [pendingPitches, setPendingPitches] = useState<PendingPitch[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchPitcherData(user.uid);
        // Fetch listener isSetUp status for cross-role button
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

  const handleAddFund = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      alert('Please enter a valid fund amount.');
      return;
    }
    const encryptedAmount = parseFloat(fundAmount) * 7900;
    router.push(`/pitcher/add-fund?a=${encryptedAmount}`);
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

  const requiredBalance = calculateTotalWithFee(pitcher.donation);
  const reservedBalance = Number(pitcher.reservedBalance) || 0;
  const availableBalance = pitcher.credit_balance - reservedBalance;

  return (
    <>
      <Head>
        <title>{pitcher.fullName} | My Pitcher Profile</title>
      </Head>
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>My Pitcher Profile</Title>
          <Subtitle>Welcome, {pitcher.fullName}</Subtitle>
          <InfoRow>
            <Label>Available Balance ($):</Label>
            <Value>{availableBalance.toFixed(2)}</Value>
          </InfoRow>

          {reservedBalance > 0 && (
            <InfoRow>
              <Label>Reserved (pending pitches):</Label>
              <Value>{reservedBalance.toFixed(2)}</Value>
            </InfoRow>
          )}

          <InfoRow>
            <Label>Total Balance ($):</Label>
            <Value>{pitcher.credit_balance.toFixed(2)}</Value>
          </InfoRow>

          <InfoRow>
            <Label>Donation per Meeting ($):</Label>
            <Value>{pitcher.donation.toFixed(2)}</Value>
          </InfoRow>

          <p style={{ marginTop: '0.0rem', color: '#333', fontSize: '16px', textAlign: 'center' }}>
            <span style={{ color: '#e74c3c', marginRight: '0.3rem' }}>🚩</span>
            Available balance must be at least
            <strong> ${requiredBalance.toFixed(2)} </strong>
            (Donation amount + {PLATFORM_FEE_PERCENTAGE}% process fee including tax).
            Otherwise, your shareable link will be inactive.
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

          {pendingPitches.length > 0 && (
            <InboxSection>
              <InboxHeader>Pending pitches ({pendingPitches.length})</InboxHeader>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 0.75rem 0' }}>
                Waiting for the listener to accept. Cancel to release the reserved balance.
              </p>
              {pendingPitches.map((m) => (
                <MeetingCard key={m.id}>
                  <MeetingCardBody>
                    <div>To <strong>{m.listenerName}</strong></div>
                    <div>Reserved: <strong>${m.reservedAmount.toFixed(2)}</strong></div>
                    {m.availability && <div>Your note: "{m.availability}"</div>}
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

          {incomingRequests.length > 0 && (
            <InboxSection>
              <InboxHeader>Incoming requests ({incomingRequests.length})</InboxHeader>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 0.75rem 0' }}>
                Listeners who want to hear your pitch. Use the Accept/Decline links in the email we sent you.
              </p>
              {incomingRequests.map((m) => (
                <MeetingCard key={m.id}>
                  <MeetingCardBody>
                    <div><strong>{m.listenerName}</strong></div>
                    <div>Donation if accepted: <strong>${m.reservedAmount.toFixed(2)}</strong></div>
                    {m.availability && <div>Their note: "{m.availability}"</div>}
                    <MeetingMeta>
                      {m.listenerEmail}
                      {m.reservedAt && ` · Received ${new Date(m.reservedAt.toMillis()).toLocaleDateString()}`}
                    </MeetingMeta>
                  </MeetingCardBody>
                </MeetingCard>
              ))}
            </InboxSection>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0rem' }}>
            <Button onClick={() => router.push('/pitcher/update-profile')}>Edit Profile</Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <Button onClick={() => router.push(listenerSetUp ? '/listener/profile' : '/listener/update-profile')}>
              {listenerSetUp ? 'Go to Listener Profile' : 'Set Up Listener Profile'}
            </Button>
          </div>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
