import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { styled } from "../styles/stitches.config";
import { auth, firestore } from "../firebase/clientApp";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Input, Textarea, Button, Field, Label } from "../components/ui";

const Wrapper = styled("div", {
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  paddingTop: "$xl",
  paddingBottom: "$xl",
});

const Card = styled("div", {
  width: "100%",
  maxWidth: "500px",
  backgroundColor: "$white",
  borderRadius: "$md",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
  padding: "$md",
  display: "flex",
  flexDirection: "column",
  gap: "$sm",
  alignItems: "center",
  marginTop: "30px",
});

const Logo = styled("img", {
  width: "50px",
  height: "50px",
  marginBottom: "$sm",
});

const Title = styled("h1", {
  fontSize: "$xl",
  textAlign: "center",
  color: "$dark",
  marginBottom: "$xs",
});

const Subtitle = styled("p", {
  textAlign: "center",
  fontSize: "$base",
  color: "$mediumgray",
  marginBottom: "$sm",
});

const ErrorBox = styled("div", {
  backgroundColor: "#fee",
  color: "#a00",
  padding: "$sm",
  borderRadius: "$sm",
  border: "1px solid #faa",
  width: "100%",
});

export default function SignupListener() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    introOrLinkedIn: "",
    donationPerMeeting: "",
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
      await setDoc(doc(firestore, "listeners", user.uid), {
        ...form,
        role: "listener",
        createdAt: Date.now(),
      });
      router.push(`/listener/${user.uid}`);
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
        <title>Sign up as Listener | DonaTalk</title>
        <meta name="description" content="Join as a listener and discover pitches that inspire donations." />
      </Head>

      <Wrapper>
        <Card>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Create Your Listener Profile</Title>
          <Subtitle>Support meaningful ideas and causes</Subtitle>

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
            <Label>Brief Intro or LinkedIn Page Link</Label>
            <Textarea name="introOrLinkedIn" rows={3} value={form.introOrLinkedIn} onChange={onChange} />
          </Field>

          <Field>
            <Label>Donation Request per Meeting ($)</Label>
            <Input name="donationPerMeeting" type="number" value={form.donationPerMeeting} onChange={onChange} />
          </Field>

          <Button onClick={signUpWithEmail} disabled={loading}>
            {loading ? "Signing up..." : "Sign up"}
          </Button>
        </Card>
      </Wrapper>
    </>
  );
}
