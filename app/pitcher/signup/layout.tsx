// app/pitcher/signup/layout.tsx
//
// Metadata carrier for the pitcher-signup route. `page.tsx` is a Client
// Component ('use client'), so it cannot export `metadata`; a `next/head`
// <Head> in an App Router client page is a no-op, which is why this page used
// to inherit the generic root <title>. This server layout supplies proper
// App Router metadata (title/description/canonical/OG/Twitter/robots) matching
// the /vs, /listeners and /calculator convention. Metadata-only, non-behavioral
// (no auth/data logic here) — Charter Sec 6: first-party, truthful claims only.

import type { Metadata } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'Create your DonaTalk pitcher account and earn a warm meeting by committing a donation to a cause the person you want to reach cares about — instead of another cold email. They accept, their charity gets funded; if they decline, you pay nothing.';

export const metadata: Metadata = {
  title: 'Sign Up to Pitch — Donation-Based Outreach',
  description: META_DESCRIPTION,
  keywords: [
    'sign up to pitch',
    'donation-based outreach',
    'cold email alternative',
    'book a meeting for charity',
    'pitch someone for a cause',
    'warm introduction alternative',
  ],
  alternates: { canonical: '/pitcher/signup' },
  openGraph: {
    type: 'website',
    url: `${BASE}/pitcher/signup`,
    title: 'Sign Up to Pitch on DonaTalk — Donation-Based Outreach',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up to Pitch on DonaTalk — Donation-Based Outreach',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

export default function PitcherSignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
