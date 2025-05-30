// app/login/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Head from 'next/head';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/clientApp';
import { Input, Button, Field, Label } from '@/components/ui';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';

const ForgotPassword = styled('a', {
  marginTop: '0.5rem',
  fontSize: '14px',
  color: '$heart',
  textDecoration: 'none',
  alignSelf: 'flex-end',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const ProminentErrorBox = styled(ErrorBox, {
  border: '2px solid #e74c3c',
  fontWeight: 'bold',
  backgroundColor: '#ffe5e5',
});

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setError('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push('/choose-a-profile');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Login Error]', error.message);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <>
      <Head>
        <title>Login | DonaTalk</title>
        <meta name="description" content="Log in to your DonaTalk profile to support or pitch meaningful causes." />
      </Head>

      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Login to DonaTalk</Title>
          <Subtitle>Access your profile to connect and support</Subtitle>

          {error && <ProminentErrorBox>{error}</ProminentErrorBox>}

          <Field>
            <Label>Email Address</Label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              onKeyPress={handleKeyPress}
            />
          </Field>

          <Field>
            <Label>Password</Label>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              onKeyPress={handleKeyPress}
            />
          </Field>

          <ForgotPassword href="#">Forgot password?</ForgotPassword>

          <Button onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
