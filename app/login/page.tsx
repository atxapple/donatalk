// app/login/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSafeReturnPath } from '@/lib/safeReturn';

// Read at submit time from window.location, since useSearchParams() can return
// null on statically-rendered routes (the login page is `○ /login` in the build).
function readReturnPath(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return getSafeReturnPath(params.get('return'));
}
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/clientApp';
import { signInWithGoogle, checkProfilesExist } from '@/lib/googleAuth';
import { trackSignup } from '@/lib/analytics';
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

const SignupPrompt = styled('p', {
  marginTop: '1.25rem',
  fontSize: '14px',
  color: '$darkgray',
  textAlign: 'center',
  '& a': {
    color: '$heart',
    fontWeight: 600,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // Carry an invite ?return= through to the signup links so gated visitors
  // who detour through login don't lose their destination.
  const [returnSuffix, setReturnSuffix] = useState('');

  useEffect(() => {
    const r = readReturnPath();
    if (r) setReturnSuffix(`?return=${encodeURIComponent(r)}`);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push(readReturnPath() ?? '/choose-a-profile');
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
        // Send welcome email (role defaults to pitcher; stubs cover both)
        await fetch('/api/send-signup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email || '',
            fullName: displayName || '',
            userId: uid,
            role: 'pitcher',
          }),
        });
        trackSignup('pitcher', 'google');
      }

      router.push(readReturnPath() ?? '/choose-a-profile');
    } catch (err) {
      console.error('[Google Login Error]', err);
      setError('An error occurred during Google sign-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    if (!form.email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      const res = await fetch('/api/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      if (!res.ok) {
        throw new Error('Failed to send');
      }
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Forgot Password Error]', error.message);
      setError('Failed to send reset email. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <>
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Login to DonaTalk</Title>
          <Subtitle>Access your profile to connect and support</Subtitle>

          {error && <ProminentErrorBox>{error}</ProminentErrorBox>}
          {success && <Subtitle style={{ color: 'green' }}>{success}</Subtitle>}

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

          <ForgotPassword href="#" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }}>Forgot password?</ForgotPassword>

          <Button onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <SignupPrompt>
            New to DonaTalk?{' '}
            <a href={`/pitcher/signup${returnSuffix}`}>Sign up as a Pitcher</a>
            {' '}·{' '}
            <a href={`/listener/signup${returnSuffix}`}>as a Listener</a>
          </SignupPrompt>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
