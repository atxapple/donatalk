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
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "$md",
  backgroundColor: "$light",
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

export default function SignupPitcher() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    organization: "",
    pitch: "",
    donation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "donation" ? Number(value) : value }));
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
        role: "pitcher", // 👈 add role here
        createdAt: Date.now(),
      });
      router.push(`/pitcher/${user.uid}`);
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
        <meta name="description" content="Create your pitcher profile and start sharing your ideas with donors." />
      </Head>

      <Wrapper>
        <Card>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Create Your Pitcher Profile</Title>
          <Subtitle>Share your ideas and support a cause</Subtitle>

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
            <Label>Company / Organization (optional)</Label>
            <Input name="organization" value={form.organization} onChange={onChange} />
          </Field>

          <Field>
            <Label>Brief Description of Your Pitch</Label>
            <Textarea name="pitch" rows={3} value={form.pitch} onChange={onChange} />
          </Field>

          <Field>
            <Label>Donation Amount per pitch ($)</Label>
            <Input name="donation" type="number" value={form.donation.toString()} onChange={onChange} />
          </Field>

          <Button onClick={signUpWithEmail} disabled={loading}>
            {loading ? "Signing up..." : "Sign up"}
          </Button>
        </Card>
      </Wrapper>
    </>
  );
}