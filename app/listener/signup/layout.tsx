// app/listener/signup/layout.tsx
//
// Metadata carrier for the listener-signup route. `page.tsx` is a Client
// Component ('use client'), so it cannot export `metadata`; a `next/head`
// <Head> in an App Router client page is a no-op, which is why this page used
// to inherit the generic root <title>. This server layout supplies proper
// App Router metadata (title/description/canonical/OG/Twitter/robots) matching
// the /vs, /listeners and /calculator convention. Metadata-only, non-behavioral
// (no auth/data logic here) — Charter Sec 6: first-party, truthful claims only.

import type { Metadata } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'Create your DonaTalk listener account and let people reach you by donating to a cause you choose. You hear only the pitches you accept, and your non-profit gets funded for your time — decline and nothing is charged.';

export const metadata: Metadata = {
  title: 'Sign Up as a Listener — Fund Your Cause',
  description: META_DESCRIPTION,
  keywords: [
    'sign up as a listener',
    'donation-based outreach',
    'fund your cause',
    'get pitched for charity',
    'support a non-profit',
    'warm introductions',
  ],
  alternates: { canonical: '/listener/signup' },
  openGraph: {
    type: 'website',
    url: `${BASE}/listener/signup`,
    title: 'Sign Up as a Listener on DonaTalk — Fund Your Cause',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up as a Listener on DonaTalk — Fund Your Cause',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

export default function ListenerSignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
