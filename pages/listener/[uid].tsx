// pages/listener/[uid].tsx 

import { GetServerSideProps } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/clientApp';
import { styled } from '../../styles/stitches.config';
import PageWrapper from '../../components/layout/PageWrapper';
import CardContainer from '../../components/layout/CardContainer';
import { Logo, Title, Subtitle, InfoBox } from '../../components/ui/shared';
import { Input, Button } from '../../components/ui';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Listener } from '@/types/listener';

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

export default function ListenerPage({ listener, uid }: { listener: Listener | null; uid: string }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState('');

  if (!hydrated) return null; // Prevent hydration mismatch

  if (!listener) {
    return (
      <PageWrapper>
        <CardContainer>
          <InfoBox>Listener not found.</InfoBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  const requiredBalance = Math.ceil(listener.donation * 1.125 * 100) / 100;
  // const isActive = pitcher.credit_balance >= requiredBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    // try {
    //   const res = await fetch('/api/send-notification', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       pitcherName: name,
    //       pitcherEmail: email,
    //       listenerName: listener.fullName,
    //       listenerEmail: listener.email,
    //       message: message,
    //     }),
    //   });

    //   const data = await res.json();
    //   if (res.ok && data.success) {
    //     setStatus('success');
    //     setResponseMessage('✅ Notification sent successfully!');
    //     setName('');
    //     setEmail('');
    //     setMessage('');
    //   } else {
    //     setStatus('error');
    //     setResponseMessage(`❌ Failed to send: ${data.error || 'Unknown error'}`);
    //   }
    // } catch (error) {
    //   console.error('[Send Notification Error]', error);
    //   setStatus('error');
    //   setResponseMessage('❌ Error sending the email.');
    // }
  };

  const handleAddFund = async () => {
    try {
      const res = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingsource: 'listenerPage',
          listenerId: uid,
          listenerName: 'TBD',
          listenerEmail: 'TBD',
          pitcherId: 'TBD',
          pitcherName: name,
          pitcherEmail: email,
          availability: message,
        }),
      });

      console.log('[Create Meeting Response]', res);

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setResponseMessage('✅ Meeting request sent successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setResponseMessage(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Create Meeting Error]', error);
      setStatus('error');
      setResponseMessage('❌ Error creating the meeting.');
    }

    const encriptedAmount = requiredBalance * 7900;
    router.push(`/listener/arrange-meeting?a=${encriptedAmount}&pitcherEmail=${email}&pitcherName=${name}&ilstenerId=${uid}&message=${message}`);
  };

  const isFormComplete = name.trim() !== '' && email.trim() !== '' && message.trim() !== '';

  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <Title>{listener.fullName} on DonaTalk</Title>
        <>
          <Subtitle>🙏 Thanks for your interest in pitching to {listener.fullName}.</Subtitle>
          <Subtitle>The brief intro or LinedIn page of {listener.fullName}: <br></br> {listener.intro}</Subtitle>
          <Subtitle>
            You need to escrow  <strong>${requiredBalance} </strong> to arrange a meeting. ${listener.donation.toFixed(2)} will be sent to support a non-profit organization after the meeting.
          </Subtitle>
          <Subtitle>🚀 Ready to chat? Fill out the form to notify the listener:</Subtitle>
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
              disabled={!isFormComplete || status === 'loading'}
              onClick={handleAddFund}
            >
              {status === 'loading' ? 'Sending...' : 'Escrow $' + requiredBalance + ' and Notify Listener'}
            </Button>
            {responseMessage && <p>{responseMessage}</p>}
          </Form>
        </>
        <Subtitle style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        ❗Want to make an effective pitch?{' '}
          <a
            href="https://donatalk.com"
            target="_blank"
            rel="noopener noreferrer"
          >
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

    return {
      props: { listener: docSnap.data() as Listener, uid: uid as string },
    };
  } catch {
    return { props: { listener: null, uid: uid as string } };
  }
};