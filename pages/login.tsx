// pages/login.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";
import { Input, Button, Field, Label } from "../components/ui";
import PageWrapper from "../components/layout/PageWrapper";
import CardContainer from "../components/layout/CardContainer";
import { Logo, Title, Subtitle, ErrorBox } from "../components/ui/shared";
import { styled } from "../styles/stitches.config";

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
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent default form behavior
    setError("");
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);
      const pitcherDoc = await getDoc(doc(firestore, "pitchers", user.uid));
      const listenerDoc = await getDoc(doc(firestore, "listeners", user.uid));

      if (pitcherDoc.exists()) {
        router.push(`/pitcher/${user.uid}`);
      } else if (listenerDoc.exists()) {
        router.push(`/listener/${user.uid}`);
      } else {
        setError("No profile found. Please contact support.");
      }
    } catch (err: any) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          setError('Login failed. Please check your email and password, and try again.');
        } else {
          setError('Something went wrong. Please try again or contact support.');
        }
    } finally {
      setLoading(false);
    }
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

          <form onSubmit={handleLogin}> {/* ✅ Add form wrapper for Enter key */}
            <Field>
              <Label>Email Address</Label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                autoFocus
              />
            </Field>

            <Field>
              <Label>Password</Label>
              <Input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </Field>

            {/* ✅ Login Button First */}
            <Button type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* ✅ Forgot Password Link After */}
            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <ForgotPassword href="#">Forgot password?</ForgotPassword>
            </div>
          </form>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
