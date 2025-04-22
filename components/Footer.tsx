import { useEffect, useState } from 'react';
import { styled } from '../styles/stitches.config';

const FooterContainer = styled('footer', {
  marginTop: 'auto',
  padding: '$md',
  backgroundColor: '$light',
  textAlign: 'center',
  fontSize: '$sm',
  color: '$mediumgray',
  borderTop: '1px solid #eee',
});

const FooterLinks = styled('div', {
  marginTop: '$xs',
  display: 'flex',
  justifyContent: 'center',
  gap: '$lg',
});

const FooterLink = styled('a', {
  color: '$mediumgray',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <FooterContainer>
      <div>© {year ?? '____'} DonaTalk</div>
      <FooterLinks>
        <FooterLink href="/terms">Terms of Service</FooterLink>
        <FooterLink href="/privacy">Privacy Policy</FooterLink>
      </FooterLinks>
    </FooterContainer>
  );
}
