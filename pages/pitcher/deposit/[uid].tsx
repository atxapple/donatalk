import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase/clientApp';
import { styled } from '../../../styles/stitches.config';

const Wrapper = styled('div', {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$light',
  padding: '$lg',
});

const Card = styled('div', {
  backgroundColor: '$white',
  borderRadius: '$md',
  padding: '$lg',
  maxWidth: '600px',
  width: '100%',
  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: '$md',
  alignItems: 'center',
});

const Title = styled('h1', {
  fontSize: '$xl',
  fontWeight: 'bold',
  textAlign: 'center',
  color: '$heart',
});

const Label = styled('label', {
  fontWeight: '600',
  width: '100%',
  textAlign: 'left',
});

const Input = styled('input', {
  padding: '$sm',
  fontSize: '$base',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  width: '100%',
  '&:focus': {
    borderColor: '$heart',
    outline: 'none',
  },
});

const Button = styled('button', {
  backgroundColor: '$heart',
  color: 'white',
  fontWeight: '600',
  padding: '$sm',
  borderRadius: '$sm',
  border: 'none',
  transition: 'background 0.2s',
  width: '100%',
  '&:hover': {
    backgroundColor: '#c0392b',
  },
  '&:disabled': {
    backgroundColor: '$mediumgray',
    cursor: 'not-allowed',
  },
});

const Warning = styled('p', {
  color: '#e74c3c',
  fontSize: '$sm',
  textAlign: 'center',
});

type Pitcher = {
  fullName: string;
  donation: number;
};

export default function DepositPage({ pitcher, uid }: { pitcher: Pitcher | null; uid: string }) {
  const router = useRouter();
  console.log(router.query); // just to satisfy lint temporarily (not ideal)
  const [deposit, setDeposit] = useState('');
  const [minRequired, setMinRequired] = useState(0);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (pitcher?.donation) {
      const min = Math.ceil(pitcher.donation * 1.127);
      setMinRequired(min);
    }
  }, [pitcher]);

  useEffect(() => {
    const amount = parseFloat(deposit);
    setValid(!isNaN(amount) && amount >= minRequired);
  }, [deposit, minRequired]);

  const handlePay = async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(parseFloat(deposit) * 100),
        meetingId: "deposit_" + Date.now(),
        listenerId: "n/a",
        pitcherId: uid,
        redirectAfter: `/pitcher/${uid}`,
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Payment error.");
    }
  };

  return (
    <Wrapper>
      <Card>
        {!pitcher ? (
          <p>Pitcher not found.</p>
        ) : (
          <>
            <Title>Deposit Funds</Title>
            <p>
              Hi <strong>{pitcher.fullName}</strong>, your donation per meeting is{" "}
              <strong>${Number(pitcher.donation).toFixed(2)}</strong>.
            </p>
            <p>
              To activate your profile, you need to deposit at least{" "}
              <strong>${minRequired}</strong> (includes 12.7% buffer).
            </p>

            <Label htmlFor="deposit">Enter Deposit Amount ($)</Label>
            <Input
              type="number"
              id="deposit"
              min="0"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />

            {!valid && (
              <Warning>
                Deposit must be at least ${minRequired}. Your page will be inactive
                if funds are lower than your donation amount.
              </Warning>
            )}

            <Button disabled={!valid} onClick={handlePay}>
              Pay & Activate My Profile
            </Button>
          </>
        )}
      </Card>
    </Wrapper>
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
      props: {
        pitcher: docSnap.data(),
        uid: uid as string,
      },
    };
  } catch {
    return {
      props: { pitcher: null, uid: uid as string },
    };
  }
};
