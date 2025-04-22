import Link from 'next/link';
import { styled } from '../styles/stitches.config';

const Nav = styled('nav', {
  display: 'flex',
  justifyContent: 'center', // centers the inner content horizontally
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

const Login = styled(Link, {
  color: '$dark',
  fontSize: '16px',
  textDecoration: 'none',
  fontWeight: '500',
  '&:hover': {
    color: '$heart',
  },
});

export default function Navbar() {
  return (
    <Nav>
      <NavContent>
        <LogoLink href="/">
          <Logo src="/logo horizontal with text.png" alt="DonaTalk" />
        </LogoLink>
        <Login href="/login">Login</Login>
      </NavContent>
    </Nav>
  );
}
