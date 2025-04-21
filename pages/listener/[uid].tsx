import { GetServerSideProps } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/clientApp';
import { styled } from '../../styles/stitches.config';
import { useState, useEffect } from 'react';

const Wrapper = styled('div', {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$light',
  padding: '$lg',
});

const Container = styled('div', {
  maxWidth: '700px',
  width: '100%',
  padding: '$lg',
  fontSize: '$base',
  color: '$dark',
  backgroundColor: '$white',
  borderRadius: '$md',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const Logo = styled('img', {
  width: '60px',
  height: '60px',
  marginBottom: '$md',
});

const Title = styled('h1', {
  fontSize: '$xl',
  fontWeight: 'bold',
  marginBottom: '$sm',
  textAlign: 'center',
  color: '$heart',
});

const Paragraph = styled('p', {
  marginBottom: '$md',
  lineHeight: '1.6',
  textAlign: 'center',
});

const Form = styled('form', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '$sm',
  width: '100%',
});

const Textarea = styled('textarea', {
  padding: '$sm',
  fontSize: '$base',
  fontFamily: 'inherit',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  width: '100%',
  maxWidth: '550px',
  resize: 'vertical',
  '&::placeholder': {
    fontFamily: 'inherit',
    fontSize: '$base',
  },
  '&:focus': {
    borderColor: '$heart',
    outline: 'none',
  },
});

const Input = styled('input', {
  padding: '$sm',
  fontSize: '$base',
  fontFamily: 'inherit',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  width: '100%',
  maxWidth: '550px',
  '&::placeholder': {
    fontFamily: 'inherit',
    fontSize: '$base',
  },
  '&:focus': {
    borderColor: '$heart',
    outline: 'none',
  },
});

const Button = styled('button', {
  backgroundColor: '$heart',
  color: 'white',
  padding: '$sm',
  fontWeight: '600',
  borderRadius: '$sm',
  border: 'none',
  transition: 'background 0.2s',
  width: '100%',
  maxWidth: '550px',
  '&:hover': {
    backgroundColor: '#c0392b',
  },
  '&:disabled': {
    backgroundColor: '$mediumgray',
    cursor: 'not-allowed',
  },
});

type Listener = {
  fullName: string;
  introOrLinkedIn: string;
  donationPerMeeting: string;
};

export default function ListenerPage({ listener, uid }: { listener: Listener | null; uid: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("paid") === "1") {
      setPaymentComplete(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thanks! Your pitch request has been sent.');
    setName('');
    setEmail('');
    setMessage('');
  };

  const handleEscrow = async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseInt(listener?.donationPerMeeting || "0") * 100,
        meetingId: "meeting_" + Date.now(),
        listenerId: uid,
        pitcherId: "pitcher_placeholder", // Replace with logged-in user ID
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Unable to start payment.");
    }
  };

  if (!listener) return <Wrapper><Container>Listener not found.</Container></Wrapper>;

  return (
    <Wrapper>
      <Container>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
        <Title>{listener.fullName} on DonaTalk</Title>
        <Paragraph>
          🙋 Meet {listener.fullName}, a listener ready to support good causes!
        </Paragraph>
        <Paragraph>
          🌐 {listener.introOrLinkedIn || "No intro provided."}
        </Paragraph>
        <Paragraph>
          💸 This listener requests <strong>${listener.donationPerMeeting}</strong> per meeting.
        </Paragraph>

        {!paymentComplete && (
          <>
            <Button onClick={handleEscrow}>Escrow</Button>
            <Paragraph style={{ color: "#a00" }}>
              ⚠ Please complete escrow payment before sending pitch request.
            </Paragraph>
          </>
        )}

        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="Available times. Example 1: Mon 2pm - 5pm or Wed morning, Example 2: calendly.com/abc-2"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <Button type="submit" disabled={!paymentComplete}>
            Send pitch request
          </Button>
        </Form>
      </Container>
    </Wrapper>
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
      props: {
        listener: docSnap.data(),
        uid: uid as string,
      },
    };
  } catch {
    return {
      props: { listener: null, uid: uid as string },
    };
  }
};
