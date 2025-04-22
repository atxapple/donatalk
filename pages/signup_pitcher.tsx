// pages/signup_pitcher.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { auth, firestore } from "../firebase/clientApp";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Input, Textarea, Button, Field, Label } from "../components/ui";
import PageWrapper from "../components/layout/PageWrapper";
import CardContainer from "../components/layout/CardContainer";
import { Logo, Title, Subtitle, ErrorBox } from "../components/ui/shared";

export default function SignupPitcher() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    areasOfInterest: "",
    donation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const signUpWithEmail = async () => {
    if (!form.fullName || !form.email || !form.password) {
      setError("Please fill out all required fields.");
      return;
    }
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(user, { displayName: form.fullName });
      await setDoc(doc(firestore, "pitchers", user.uid), {
        ...form,
        role: "pitcher",
        createdAt: Date.now(),
      });
      router.push(`/pitcher/deposit/${user.uid}`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <>
      <Head>
        <title>Sign up as Pitcher | DonaTalk</title>
        <meta name="description" content="Join DonaTalk as a pitcher and receive support for your cause." />
      </Head>

      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Create Your Pitcher Profile</Title>
          <Subtitle>Share your story and inspire donations</Subtitle>

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

          <Button onClick={signUpWithEmail} disabled={loading}>
            {loading ? "Signing up..." : "Sign up"}
          </Button>
        </CardContainer>
      </PageWrapper>
    </>
  );
}