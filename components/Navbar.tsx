// components/Navbar.tsx

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/clientApp';
import { styled } from '../styles/stitches.config';

const Nav = styled('nav', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '$md $lg',
  backgroundColor: '$light',
  borderBottom: '1px solid #eee',
});

const NavContent = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  maxWidth: '500px',
});

const LogoLink = styled(Link, {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
});

const Logo = styled('img', {
  width: '197px',
  height: '50px',
});

const NavLink = styled(Link, {
  color: '$dark',
  fontSize: '16px',
  textDecoration: 'none',
  fontWeight: '500',
  marginLeft: '1rem',
  '&:hover': {
    color: '$heart',
  },
});

const LogoutButton = styled('button', {
  color: '$dark',
  fontSize: '16px',
  textDecoration: 'none',
  fontWeight: '500',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  marginLeft: '1rem',
  '&:hover': {
    color: '$heart',
  },
});

export default function Navbar() {
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
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Nav>
      <NavContent>
        <LogoLink href="https://donatalk.com">
          <Logo src="/logo horizontal with text.png" alt="DonaTalk" />
        </LogoLink>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NavLink href="/pitcher/profile">Profile</NavLink>  {/* ✅ Added Profile link */}
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          </div>
        ) : (
          <NavLink href="/login">Login</NavLink>
        )}
      </NavContent>
    </Nav>
  );
}
