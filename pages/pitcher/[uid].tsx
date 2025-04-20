import { GetServerSideProps } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/clientApp';
import { styled } from '../../styles/stitches.config';
import { useState } from 'react';

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
});

type Pitcher = {
  fullName: string;
  pitch: string;
  donation: number;
};

export default function PitcherPage({ pitcher }: { pitcher: Pitcher | null }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thanks! We got your info.');
    setName('');
    setEmail('');
    setMessage('');
  };

  if (!pitcher) return <Wrapper><Container>Pitcher not found.</Container></Wrapper>;

  return (
    <Wrapper>
      <Container>
        <Logo src="http://youngmok.com/public_data/DonaTalk_Logo_150.png" alt="DonaTalk Logo" />
        <Title>{pitcher.fullName} on DonaTalk</Title>
        <Paragraph>
          🙏 Thanks for interest in listening to {pitcher.fullName}&rsquo;s story.
        </Paragraph>
        <Paragraph>
          The story is about - &quot;{pitcher.pitch}&quot;
        </Paragraph>
        <Paragraph>
          {pitcher.fullName} will donate <strong>${pitcher.donation}</strong> to support your favorite non-profit organization
          (you can choose later) after the meeting.
        </Paragraph>
        <Paragraph>
          🚀 Ready to chat? Fill out the form to get started:
        </Paragraph>

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
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <Button type="submit">Notify acceptance and availability</Button>
        </Form>
      </Container>
    </Wrapper>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { uid } = context.query;

  try {
    const docRef = doc(firestore, 'pitchers', uid as string);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { props: { pitcher: null } };
    }

    return {
      props: {
        pitcher: docSnap.data(),
      },
    };
  } catch {
    return {
      props: { pitcher: null },
    };
  }
};
