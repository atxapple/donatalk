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
      const user = userCredential.user;

      await setDoc(doc(firestore, 'pitchers', user.uid), {
        fullName: form.fullName,
        email: form.email,
        areasOfInterest: form.areasOfInterest,
        donation: parseFloat(form.donation),
        credit_balance: 0, // ✅ Add credit balance initialized to 0
        createdAt: Date.now(),
      });

      router.push(`/pitcher/${user.uid}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Signup as Pitcher | DonaTalk</title>
        <meta name="description" content="Create your Pitcher profile on DonaTalk." />
      </Head>

      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Signup as Pitcher</Title>
          <Subtitle>Share your cause and inspire support</Subtitle>

          {error && <ErrorBox>{error}</ErrorBox>}

          <Field>
            <Label>Full Name</Label>
            <Input name="fullName" value={form.fullName} onChange={onChange} />
          </Field>

          <Field>
            <Label>Email Address</Label>
            <Input name="email" type="email" value={form.email} onChange={onChange} />
          </Field>

          <Field>
            <Label>Password</Label>
            <Input name="password" type="password" value={form.password} onChange={onChange} />
          </Field>

          <Field>
            <Label>Areas of Interest</Label>
            <Textarea name="areasOfInterest" rows={3} value={form.areasOfInterest} onChange={onChange} />
          </Field>

          <Field>
            <Label>Donation Request per Meeting ($)</Label>
            <Input name="donation" type="number" value={form.donation} onChange={onChange} />
          </Field>

          <Button onClick={handleSignup} disabled={loading}>
            {loading ? 'Signing up...' : 'Signup'}
          </Button>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
