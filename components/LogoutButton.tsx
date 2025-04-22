import { useRouter } from 'next/router';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/clientApp';
import { Button } from './ui';
import { useEffect, useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      {isAuthenticated ? (
        <Button onClick={handleLogout}>Logout</Button>
      ) : (
        <Button onClick={() => router.push('/login')}>Login</Button>
      )}
    </>
  );
}
