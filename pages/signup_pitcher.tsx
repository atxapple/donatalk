import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebase/clientApp';
import { doc, setDoc } from 'firebase/firestore';
import { Input, Textarea, Button, Field, Label } from '../components/ui';
import PageWrapper from '../components/layout/PageWrapper';
import CardContainer from '../components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '../components/ui/shared';
import { styled } from '../styles/stitches.config';

const ProminentErrorBox = styled(ErrorBox, {
  border: '2px solid #e74c3c',
  fontWeight: 'bold',
  backgroundColor: '#ffe5e5',
});

export default function SignupPitcher() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    areasOfInterest: '',
    donation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async () => {
    setError('');
    if (!form.fullName || !form.email || !form.password || !form.areasOfInterest || !form.donation) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(firestore, 'pitchers', uid), {
        fullName: form.fullName,
        email: form.email,
        areasOfInterest: form.areasOfInterest,
        donation: parseFloat(form.donation),
        credit_balance: 0, // ✅ Initialize credit balance to 0
        createdAt: Date.now(),
      });

      router.push(`/pitcher/profile`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error.message);
      setError(error.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignup();
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up as Pitcher | DonaTalk</title>
        <meta name="description" content="Sign up as a pitcher to share your cause on DonaTalk." />
      </Head>

      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Sign Up as a Pitcher</Title>
          <Subtitle>Share your cause and connect with supporters</Subtitle>

          {error && <ProminentErrorBox>{error}</ProminentErrorBox>}

          <Field>
            <Label>Full Name</Label>
            <Input name="fullName" value={form.fullName} onChange={onChange} onKeyPress={handleKeyPress} />
          </Field>

          <Field>
            <Label>Email Address</Label>
            <Input name="email" type="email" value={form.email} onChange={onChange} onKeyPress={handleKeyPress} />
          </Field>

          <Field>
            <Label>Password</Label>
            <Input name="password" type="password" value={form.password} onChange={onChange} onKeyPress={handleKeyPress} />
          </Field>

          <Field>
            <Label>Areas of Interest</Label>
            <Textarea name="areasOfInterest" rows={3} value={form.areasOfInterest} onChange={onChange} />
          </Field>

          <Field>
            <Label>Donation Request per Meeting ($)</Label>
            <Input name="donation" type="number" value={form.donation} onChange={onChange} onKeyPress={handleKeyPress} />
          </Field>

          <Button onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
