// lib/googleAuth.ts

import { signInWithPopup, AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore, googleProvider } from '@/firebase/clientApp';

type GoogleSignInResult =
  | { userCredential: import('firebase/auth').UserCredential; error: null; cancelled: false }
  | { userCredential: null; error: string; cancelled: false }
  | { userCredential: null; error: null; cancelled: true };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return { userCredential, error: null, cancelled: false };
  } catch (err) {
    const authError = err as AuthError;
    const code = authError.code;

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { userCredential: null, error: null, cancelled: true };
    }

    if (code === 'auth/popup-blocked') {
      return {
        userCredential: null,
        error: 'Popup was blocked by your browser. Please allow popups and try again.',
        cancelled: false,
      };
    }

    if (code === 'auth/account-exists-with-different-credential') {
      return {
        userCredential: null,
        error: 'An account with this email already exists. Please log in with email and password first.',
        cancelled: false,
      };
    }

    console.error('[Google Sign-In Error]', authError.message);
    return {
      userCredential: null,
      error: authError.message || 'An error occurred during Google sign-in.',
      cancelled: false,
    };
  }
}

export async function checkProfilesExist(uid: string): Promise<{ hasPitcher: boolean; hasListener: boolean }> {
  const [pitcherSnap, listenerSnap] = await Promise.all([
    getDoc(doc(firestore, 'pitchers', uid)).catch(() => null),
    getDoc(doc(firestore, 'listeners', uid)).catch(() => null),
  ]);

  return {
    hasPitcher: pitcherSnap?.exists() ?? false,
    hasListener: listenerSnap?.exists() ?? false,
  };
}
