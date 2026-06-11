import { redirect } from 'next/navigation';

export default function Home() {
  // The bare domain is an acquisition surface: new visitors should land on
  // signup (which links to login), not a login wall.
  redirect('/pitcher/signup');
}
