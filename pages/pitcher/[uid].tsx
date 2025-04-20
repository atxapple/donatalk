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

const Input = styled('input', {
  padding: '$md',
  fontSize: '$md',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  width: '100%',
  maxWidth: '550px',
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

export default function PitcherPage({ pitcher }: { pitcher: any }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thanks! We got your availability.');
    setMessage('');
  };

  if (!pitcher) return <Wrapper><Container>Pitcher not found.</Container></Wrapper>;

  return (
    <Wrapper>
      <Container>
        <Logo src="http://youngmok.com/public_data/DonaTalk_Logo_150.png" alt="DonaTalk Logo" />
        <Title>{pitcher.fullName} on DonaTalk</Title>
        <Paragraph>
          Thanks for interest in listening to {pitcher.fullName}'s story. 
        </Paragraph>
        <Paragraph>
          "{pitcher.pitch}"
        </Paragraph>
        <Paragraph>
          {pitcher.fullName} will donate <b> ${pitcher.donation} </b> to support your favorite a non-profit organization (you can choose later) after the meeting
        </Paragraph>
        <Paragraph>
          Want to hear the story? Share your available time or link (e.g. Calendly) below.
        </Paragraph>

        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="example 1: Mon 2pm - 5pm or Wed morning"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <Button type="submit">Submit</Button>
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
  } catch (error) {
    return {
      props: { pitcher: null },
    };
  }
};