import { useState } from "react";
import { useRouter } from "next/router";
import { styled } from "../styles/stitches.config";
import { auth, firestore } from "../firebase/clientApp";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  Wrapper,
  Card,
  Title,
  Subtitle,
  Field,
  Label,
  Input,
  Textarea,
  Button,
  ErrorBox,
} from "../components/SignupStyles";


export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    organization: "",
    pitch: "",
    donation: 50,
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
        createdAt: Date.now(),
      });
      router.push(`/pitcher/${user.uid}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Card>
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
          <Textarea name="pitch" rows={4} value={form.pitch} onChange={onChange} />
        </Field>

        <Field>
          <Label>Donation Amount per pitch ($)</Label>
          <Input name="donation" type="number" value={form.donation.toString()} onChange={onChange} />
        </Field>

        <Button onClick={signUpWithEmail} disabled={loading}>
          {loading ? "Signing up..." : "Sign up with Email"}
        </Button>
      </Card>
    </Wrapper>
  );
}
