// pages/pitcher/[uid].tsx

import { GetServerSideProps } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/clientApp';
import { styled } from '../../styles/stitches.config';
import PageWrapper from '../../components/layout/PageWrapper';
import CardContainer from '../../components/layout/CardContainer';
import { Logo, Title, Subtitle, InfoBox } from '../../components/ui/shared';
import { Input, Button } from '../../components/ui';
import { useEffect, useState } from 'react';
import { Pitcher } from '@/types/pitcher';

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

export default function PitcherPage({ pitcher, uid }: { pitcher: Pitcher | null; uid: string }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState('');

  if (!hydrated) return null; // Prevent hydration mismatch

  if (!pitcher) {
    return (
      <PageWrapper>
        <CardContainer>
          <InfoBox>Pitcher not found.</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const requiredBalance = Math.ceil(pitcher.donation * 1.125 * 100) / 100;
  const isActive = pitcher.credit_balance >= requiredBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pitcherName: pitcher.fullName,
          pitcherEmail: pitcher.email,
          listenerName: name,
          listenerEmail: email,
          message: message,
          donation: pitcher.donation,
          source: 'pitcherPage'
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setResponseMessage('✅ Notification sent successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setResponseMessage(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Send Notification Error]', error);
      setStatus('error');
      setResponseMessage('❌ Error sending the email.');
    }
  };

  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <Title>{pitcher.fullName} on DonaTalk</Title>
        {isActive ? (
          <>
            <Subtitle>🙏 Thanks for your interest in listening to {pitcher.fullName}&rsquo;s story.</Subtitle>
            <Subtitle>The pitch is about - &quot;{pitcher.pitch}&quot;</Subtitle>
            <Subtitle>
              {pitcher.fullName} will donate <strong>${pitcher.donation.toFixed(2)}</strong> to support your favorite non-profit organization after the meeting.
            </Subtitle>
            <Subtitle>🚀 Ready to chat? Fill out the form to notify the pitcher:</Subtitle>
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
              <Button type="submit" disabled={status === 'loading' || !name.trim() || !email.trim() || !message.trim()}>
                {status === 'loading' ? 'Sending...' : 'Notify Acceptance and Availability'}
              </Button>
              {responseMessage && <p>{responseMessage}</p>}
            </Form>
          </>
        ) : (
          <InfoBox>
            ℹ️ This link is currently inactive because the available fund is not sufficient to cover the donation and processing fee.
            <br />
            Pitcher can add funds from their profile page to activate this link.
          </InfoBox>
        )}
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

    return {
      props: { pitcher: docSnap.data() as Pitcher, uid: uid as string },
    };
  } catch {
    return { props: { pitcher: null, uid: uid as string } };
  }
};