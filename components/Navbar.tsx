import Link from 'next/link';
import { styled } from '../styles/stitches.config';

const Nav = styled('nav', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$md $lg',
  backgroundColor: '$light',
  borderBottom: '1px solid #eee',
});

const Logo = styled('img', {
  width: '88px',
  height: '77px',
});

const NavLinks = styled('div', {
  display: 'flex',
  gap: '$lg',
  alignItems: 'center',
  fontSize: '$base',
});

// ✅ This is now a styled Next.js Link, NOT an <a>
const NavLink = styled(Link, {
  color: '$dark',
  textDecoration: 'none',
  fontWeight: '500',
  cursor: 'pointer',
  '&:hover': {
    color: '$heart',
  },
});

export default function Navbar() {
  return (
    <Nav>
      <NavLink href="/">
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk" />
      </NavLink>
      <NavLinks>
        <NavLink href="/">Home</NavLink>
        <NavLink href="/about">About</NavLink>
        <NavLink href="/signup_pitcher">Pitcher</NavLink>
        <NavLink href="/signup_listener">Listener</NavLink>
        <NavLink href="/login">Login</NavLink>
      </NavLinks>
    </Nav>
  );
}
