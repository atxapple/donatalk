import { styled } from '../../styles/stitches.config';

export const Logo = styled('img', {
  width: '50px',
  height: '50px',
  marginBottom: '$sm',
});

export const Title = styled('h1', {
  fontSize: '$xl',
  textAlign: 'center',
  color: '$dark',
  marginBottom: '$xs',
});

export const Subtitle = styled('p', {
  textAlign: 'center',
  fontSize: '$base',
  // color: '$mediumgray',
  color: '$darkgray',
  marginBottom: '$sm',
});

export const ErrorBox = styled('div', {
  backgroundColor: '#fee',
  color: '#a00',
  padding: '$sm',
  borderRadius: '$sm',
  border: '1px solid #faa',
  width: '100%',
});

export const InfoBox = styled('div', {
  padding: '1rem',
  border: '1px solid #3498db', // blue border
  backgroundColor: '#eaf6ff',   // light blue background
  color: '#2c3e50',             // dark blue text
  borderRadius: '8px',
  fontSize: '15px',
  lineHeight: '1.5',
  textAlign: 'center',
  marginTop: '1rem',
});