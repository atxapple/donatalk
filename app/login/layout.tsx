// app/login/layout.tsx
//
// Metadata carrier for the /login route. `page.tsx` is a Client Component
// ('use client'), so it cannot export `metadata`; the `next/head` <Head> it
// carried is an App Router no-op, which is why /login inherited the generic
// root <title> with no canonical/OG/Twitter despite being in sitemap.ts. This
// server layout supplies proper App Router metadata (title/description/keywords/
// canonical/OG/Twitter/robots) matching the /vs, /listeners, /calculator and
// /*/signup convention. Title carries no "| DonaTalk" suffix — the root layout's
// `%s | DonaTalk` template appends it once (avoids the doubled-brand defect
// fixed in v0.15.1). Metadata-only, non-behavioral (no auth/data logic here) —
// Charter Sec 6: first-party, truthful claims only.

import type { Metadata } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'Log in to your DonaTalk account to manage your pitcher or listener profile, fund a warm meeting, or accept pitches that donate to a cause you choose.';

export const metadata: Metadata = {
  title: 'Log In to Your Account',
  description: META_DESCRIPTION,
  keywords: [
    'donatalk login',
    'log in to donatalk',
    'donation-based outreach',
    'warm introductions',
  ],
  alternates: { canonical: '/login' },
  openGraph: {
    type: 'website',
    url: `${BASE}/login`,
    title: 'Log In to DonaTalk',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Log In to DonaTalk',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
