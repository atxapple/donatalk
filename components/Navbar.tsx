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
  width: '197px',
  height: '50px',
});

const NavLink = styled(Link, {
  color: '$dark',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '$base',
  cursor: 'pointer',
  '&:hover': {
    color: '$heart',
  },
});

export default function Navbar() {
  return (
    <Nav>
      <NavLink href="/">
        <Logo src="/Donatalk_logo_horizontal_197x50.png" alt="DonaTalk" />
      </NavLink>
      <NavLink href="/login">Login</NavLink>
    </Nav>
  );
}
