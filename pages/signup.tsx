import { useState }    from "react";
import { useRouter }   from "next/router";
import { auth, firestore } from "../firebase/clientApp";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", email: "", password: "",
    organization: "", pitch: "", donation: 50
  });
  const [error, setError] = useState("");

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const signUpWithEmail = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCred.user, { displayName: form.fullName });
      // write profile doc
      await setDoc(doc(firestore, "pitchers", userCred.user.uid), {
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        organization: form.organization.trim() || null,
        pitch:    form.pitch.trim(),
        donation: Number(form.donation),
        createdAt: Date.now()
      });
      router.push(`/pitcher/${userCred.user.uid}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const signUpWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      // if new user, create profile
      const userRef = doc(firestore, "pitchers", userCred.user.uid);
      await setDoc(userRef, {
        fullName: userCred.user.displayName,
        email:    userCred.user.email,
        organization: null,
        pitch:    form.pitch.trim(),
        donation: Number(form.donation),
        createdAt: Date.now()
      }, { merge: true });
      router.push(`/pitcher/${userCred.user.uid}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl mb-4">Pitcher Sign Up</h1>
      {error && <p className="text-red-600">{error}</p>}
      <input name="fullName" placeholder="Full Name"    onChange={onChange} className="input" />
      <input name="email"    placeholder="Email Address" onChange={onChange} className="input" />
      <input name="password" type="password" placeholder="Password" onChange={onChange} className="input" />
      <input name="organization" placeholder="Company/Organization (opt.)" onChange={onChange} className="input" />
      <textarea name="pitch" placeholder="Brief Description of Your Pitch" onChange={onChange} className="input h-24" />
      <input name="donation" type="number" placeholder="Donation Amount per pitch ($)" value={form.donation}
             onChange={onChange} className="input" />
      <button onClick={signUpWithEmail}    className="btn w-full">Sign up with Email</button>
      <button onClick={signUpWithGoogle}   className="btn w-full mt-2">Sign up with Google</button>
    </div>
  );
}
