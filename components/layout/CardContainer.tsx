import { styled } from '../../styles/stitches.config';

const CardContainer = styled('div', {
  width: '100%',
  maxWidth: '500px',
  backgroundColor: '$white',
  borderRadius: '$md',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
  padding: '$md',
  display: 'flex',
  flexDirection: 'column',
  gap: '$sm',
  alignItems: 'center',
  marginTop: '30px',
});

export default CardContainer;