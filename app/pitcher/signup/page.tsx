// app/pitcher/signup/page.tsx

'use client';

import slugify from 'slugify';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ Updated for App Router
import Head from 'next/head';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/firebase/clientApp'; // ✅ Adjust path if needed
import { doc, setDoc, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { Input, Textarea, Button, Field, Label } from '@/components/ui';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';
import Script from 'next/script';

async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName, { lower: true, remove: /[^a-zA-Z0-9]/g });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const q = query(collection(firestore, 'pitchers'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) break;
    slug = `${baseSlug}${++counter}`;
  }

  return slug;
}

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
    aboutPitch: '',
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
    if (!form.fullName || !form.email || !form.password || !form.aboutPitch || !form.donation) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;
      const slug = await generateUniqueSlug(form.fullName);

      await setDoc(doc(firestore, 'pitchers', uid), {
        fullName: form.fullName,
        email: form.email,
        pitch: form.aboutPitch,
        donation: parseFloat(form.donation),
        credit_balance: 0,
        slug, // 👈 save the unique slug here
        createdAt: Timestamp.now(),
      });

      await setDoc(doc(firestore, 'listeners', uid), {
        fullName: form.fullName,
        email: form.email,
        intro: '',
        donation: 0,
        slug, // 👈 save the unique slug here
        createdAt: Timestamp.now(),
      });

      // ✅ Send signup email notification
      await fetch('/api/send-signup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          userId: uid,
          role: 'pitcher',
        }),
      });

      router.push('/pitcher/profile'); // ✅ Navigate after sending the email
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
      {/* Google Tag Manager */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17050482317"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-17050482317');
      `}
      </Script>
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
            <Label>About Pitch (Brief Description)</Label>
            <Textarea name="aboutPitch" rows={3} value={form.aboutPitch} onChange={onChange} />
          </Field>

          <Field>
            <Label>Donation per Meeting ($)</Label>
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
