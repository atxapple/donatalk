import { styled } from '../../styles/stitches.config';

const AdminContainer = styled('div', {
  width: '100%',
  maxWidth: '1200px',
  backgroundColor: '$white',
  borderRadius: '$md',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
  padding: '$lg',
  display: 'flex',
  flexDirection: 'column',
  gap: '$md',
  marginTop: '30px',
});

export default AdminContainer;
