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
  color: '$mediumgray',
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
