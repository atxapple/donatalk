// app/login/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Head from 'next/head';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/clientApp';
import { signInWithGoogle, checkProfilesExist } from '@/lib/googleAuth';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
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

const Divider = styled('div', {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  margin: '16px 0',
  color: '#999',
  fontSize: '14px',
  '&::before, &::after': {
    content: '""',
    flex: 1,
    height: '1px',
    backgroundColor: '#ddd',
  },
  '&::before': { marginRight: '12px' },
  '&::after': { marginLeft: '12px' },
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.cancelled) return;
      if (result.error) { setError(result.error); return; }
      if (!result.userCredential) return;

      const { uid, displayName, email } = result.userCredential.user;
      const { hasPitcher, hasListener } = await checkProfilesExist(uid);

      if (!hasPitcher && !hasListener) {
        // First-time Google user — create both stub profiles
        await fetch('/api/create-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            fullName: displayName || '',
            email: email || '',
            role: 'both-stubs',
          }),
        });
        // Send welcome email
        await fetch('/api/send-signup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email || '',
            fullName: displayName || '',
          }),
        });
      }

      router.push('/choose-a-profile');
    } catch (err) {
      console.error('[Google Login Error]', err);
      setError('An error occurred during Google sign-in. Please try again.');
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

          <GoogleSignInButton onClick={handleGoogleLogin} disabled={loading} />

          <Divider>or</Divider>

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
