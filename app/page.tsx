import { redirect } from 'next/navigation';

export default function Home() {
  // The bare domain is an acquisition surface: new visitors should browse real
  // listeners + the causes they support before hitting any signup wall.
  redirect('/listeners');
}
