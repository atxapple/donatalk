// components/Footer.tsx

'use client';  

import { styled } from '../styles/stitches.config';

const FooterContainer = styled('footer', {
  padding: '2rem 1rem',
  backgroundColor: '#f9f9f9',
  borderTop: '1px solid #eee',
  textAlign: 'center',
  fontSize: '14px',
  color: '#666',
  marginTop: 'auto',
});

const FooterLinks = styled('div', {
  marginTop: '0.5rem',
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '1.5rem',
  fontSize: '14px',
  color: '#666',
});

const FooterLink = styled('a', {
  color: '#666',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

export default function Footer() {
  return (
    <FooterContainer>
      <div>© 2025 DonaTalk. All rights reserved.</div>
      <FooterLinks>
        <FooterLink href="https://donatalk.com/terms-of-service/">Terms of Service</FooterLink>
        <FooterLink href="https://donatalk.com/privacy-policy/">Privacy Policy</FooterLink>
        <FooterLink href="mailto://support@donatalk.com">Contact Us</FooterLink>
      </FooterLinks>
    </FooterContainer>
  );
}
