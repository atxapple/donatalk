// app/pitcher/signup/page.tsx

'use client';

import slugify from 'slugify';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ✅ Updated for App Router
import { getSafeReturnPath } from '@/lib/safeReturn';

function readReturnPath(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return getSafeReturnPath(params.get('return'));
}
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/firebase/clientApp'; // ✅ Adjust path if needed
import { doc, setDoc, Timestamp, collection, getDoc, getDocs, query, where } from 'firebase/firestore';
import { signInWithGoogle, checkProfilesExist } from '@/lib/googleAuth';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { Input, Textarea, Button, Field, Label } from '@/components/ui';
import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle, ErrorBox } from '@/components/ui/shared';
import { MIN_DONATION_USD, calculateTotalWithFee } from '@/lib/constants';
import { useEffect } from 'react';

// When signup is reached from a listener's public page (?return=/listener/{uid}),
// the visitor's goal is to book THAT listener — pitch/donation details about their
// own future page are deferred to safe defaults they can edit later.
function inviteListenerUidFrom(returnPath: string | null): string | null {
  const m = returnPath?.match(/^\/listener\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}
import { styled } from '@/styles/stitches.config';
import { trackSignup } from '@/lib/analytics';

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

const HowItWorks = styled('ol', {
  width: '100%',
  margin: '0 0 16px',
  padding: '14px 16px 14px 34px',
  backgroundColor: '#f8f6f4',
  border: '1px solid #eee',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#333',
  lineHeight: 1.55,
  '& li': { marginBottom: '4px' },
  '& strong': { color: '#C26148' },
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
  const [inviteUid, setInviteUid] = useState<string | null>(null);
  const [inviteListener, setInviteListener] = useState<{ fullName: string; donation: number } | null>(null);

  useEffect(() => {
    const uid = inviteListenerUidFrom(readReturnPath());
    setInviteUid(uid);
    if (!uid) return;
    getDoc(doc(firestore, 'listeners', uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        if (d.isSetUp !== false && !d.deletedAt) {
          setInviteListener({ fullName: d.fullName || '', donation: Number(d.donation) || 0 });
        }
      })
      .catch(() => {});
  }, []);

  const isInvite = !!inviteUid;

  // After an invite signup, jump straight to PayPal preloaded with the amount
  // this listener requires; add-fund returns to the listener page to book.
  const nextAfterSignup = (): string => {
    const returnTo = readReturnPath();
    if (!returnTo) return '/pitcher/profile';
    if (inviteUid && inviteListener && inviteListener.donation > 0) {
      const required = calculateTotalWithFee(inviteListener.donation);
      return `/pitcher/add-fund?min=${required}&return=${encodeURIComponent(returnTo)}`;
    }
    return returnTo;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async () => {
    setError('');
    if (!form.fullName || !form.email || !form.password || (!isInvite && (!form.aboutPitch || !form.donation))) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isInvite && parseFloat(form.donation) < MIN_DONATION_USD) {
      setError(`Donation per meeting must be at least $${MIN_DONATION_USD}.`);
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
        pitch: isInvite ? '' : form.aboutPitch,
        donation: isInvite ? MIN_DONATION_USD : parseFloat(form.donation),
        credit_balance: 0,
        slug, // 👈 save the unique slug here
        isSetUp: true,
        createdAt: Timestamp.now(),
      });

      await setDoc(doc(firestore, 'listeners', uid), {
        fullName: form.fullName,
        email: form.email,
        intro: '',
        donation: 0,
        slug, // 👈 save the unique slug here
        isSetUp: false,
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

      trackSignup('pitcher', 'email');
      router.push(nextAfterSignup()); // ✅ Navigate after sending the email
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error.message);
      setError(error.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSignup = async () => {
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
        await fetch('/api/create-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            fullName: displayName || '',
            email: email || '',
            // Invite flow: create a ready-to-book pitcher profile with safe
            // defaults instead of stubs, so the visitor isn't detoured through
            // update-profile before they can fund and book.
            role: isInvite ? 'pitcher' : 'both-stubs',
            ...(isInvite && { donation: MIN_DONATION_USD }),
          }),
        });
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

      router.push(isInvite ? nextAfterSignup() : (readReturnPath() ?? '/choose-a-profile'));
    } catch (err) {
      console.error('[Google Signup Error]', err);
      setError('An error occurred during Google sign-in. Please try again.');
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
      <PageWrapper>
        <CardContainer>
          <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />
          <Title>Sign Up as a Pitcher</Title>
          {isInvite ? (
            <Subtitle>
              One quick step before you can pitch
              {inviteListener?.fullName ? ` ${inviteListener.fullName}` : ''} — then add your
              donation budget via PayPal and book your meeting.
            </Subtitle>
          ) : (
            <Subtitle>Share your cause and connect with supporters</Subtitle>
          )}

          {!isInvite && (
            <HowItWorks>
              <li>Find a person you want to pitch on DonaTalk.</li>
              <li>Commit a <strong>$10+ donation</strong> to the cause they care about.</li>
              <li>They accept, you meet — their charity gets paid. <strong>No acceptance, no charge.</strong></li>
            </HowItWorks>
          )}

          {error && <ProminentErrorBox>{error}</ProminentErrorBox>}

          <GoogleSignInButton onClick={handleGoogleSignup} disabled={loading} label="Sign up with Google" />

          <Divider>or</Divider>

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

          {!isInvite && (
            <>
              <Field>
                <Label>About Pitch (Brief Description)</Label>
                <Textarea name="aboutPitch" rows={3} value={form.aboutPitch} onChange={onChange} />
              </Field>

              <Field>
                <Label>Donation per Meeting ($ — minimum {MIN_DONATION_USD})</Label>
                <Input name="donation" type="number" min={MIN_DONATION_USD} placeholder={`${MIN_DONATION_USD} or more`} value={form.donation} onChange={onChange} onKeyPress={handleKeyPress} />
              </Field>
            </>
          )}

          <Button onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </CardContainer>
      </PageWrapper>
    </>
  );
}
