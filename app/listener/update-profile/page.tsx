//  listener/update-profile/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ App Router uses next/navigation
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/clientApp';
import Head from 'next/head';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { Input, Textarea, Button, Field, Label } from '@/components/ui';
import { styled } from '@/styles/stitches.config';
import {Listener} from '@/types/listener'

const Form = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginTop: '1.5rem',
});

export default function ListenerUpdateProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<Listener>({
    fullName: '',
    email: '',
    intro: '',
    donation: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await fetchPitcherData(user.uid);
      } else {
        router.push('/login'); // ✅ Navigation updated for App Router
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchPitcherData = async (uid: string) => {
    try {
      const docRef = doc(firestore, 'listeners', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Listener;
        setForm(data);
      } else {
        setError('Your profile was not found.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error.message);
      setError('Failed to load profile. Please try again later.');
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'donation' ? Number(value) : value }));
  };

  const handleUpdate = async () => {
    if (!form.fullName || !form.donation) {
      setError('Full Name and Donation fields are required.');
      return;
    }
    setLoading(true);
    try {
      if (userId) {
        const docRef = doc(firestore, 'listeners', userId);
        await updateDoc(docRef, {
          fullName: form.fullName,
          intro: form.intro,
          donation: form.donation,
        });
        router.push('/listener/profile'); // ✅ Updated push for App Router
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error.message);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <PageWrapper>
        <CardContainer>
          <ErrorBox>{error}</ErrorBox>
        </CardContainer>
      </PageWrapper>
    );
  }

  return (
    <>
      <Head>
        <title>Update Pitcher Profile | DonaTalk</title>
      </Head>
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Update Your Profile</Title>
          <Subtitle>Keep your information up to date</Subtitle>

          <Form>
            <Field>
              <Label>Full Name</Label>
              <Input name="fullName" value={form.fullName} onChange={onChange} />
            </Field>

            <Field>
              <Label>Email Address (cannot edit)</Label>
              <Input name="email" value={form.email} disabled />
            </Field>

            <Field>
              <Label>Brief Intro or LinedIn Page </Label>
              <Textarea name="intro" rows={3} value={form.intro} onChange={onChange} />
            </Field>

            <Field>
              <Label>Donation Request per Meeting ($)</Label>
              <Input name="donation" type="number" value={form.donation} onChange={onChange} />
            </Field>

            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </Form>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
