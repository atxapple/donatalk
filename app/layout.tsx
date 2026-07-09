// /app/layout.tsx
import '../styles/globals.css';                      // ✅ Global styles
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';           // ✅ Navbar component
import Footer from '../components/Footer';           // ✅ Footer component
import { Providers } from './providers';             // ✅ Added Theme Provider
import LoadingScreen from '../components/LoadingScreen'; // ✅ Added Loading Screen
import GoogleTag from '../components/GoogleTag';
import RedditPixel from '../components/RedditPixel';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const OG_DESCRIPTION =
  'Warm introductions that fund a cause. Pitchers donate to a non-profit to earn a meeting; listeners direct the donation to a cause they care about.';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'DonaTalk — Turn sales pitches into charitable donations',
    template: '%s | DonaTalk',
  },
  description:
    'DonaTalk turns cold outreach into warm introductions: pitchers donate to a non-profit to earn a meeting, and listeners send that donation to a cause they care about.',
  applicationName: 'DonaTalk',
  keywords: [
    'warm introductions',
    'cold email alternatives',
    'donation-based outreach',
    'charitable sales outreach',
    'book a meeting for charity',
    'B2B sales meetings',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'DonaTalk',
    url: BASE,
    title: 'DonaTalk — Turn sales pitches into charitable donations',
    description: OG_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DonaTalk — Turn sales pitches into charitable donations',
    description: OG_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE}/#organization`,
      name: 'DonaTalk',
      url: BASE,
      logo: `${BASE}/DonaTalk_icon_88x77.png`,
      description:
        'DonaTalk turns sales pitches into charitable donations — warm introductions that fund a non-profit.',
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE}/#website`,
      name: 'DonaTalk',
      url: BASE,
      publisher: { '@id': `${BASE}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      {/* Google Ads + GA4 + Reddit */}
      <GoogleTag />
      <RedditPixel />

      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Providers>
          <LoadingScreen>
            <Navbar />                               {/* ✅ Added Navbar */}
            <main style={{ flexGrow: 1 }}>{children}</main>
            <Footer />                               {/* ✅ Added Footer */}
          </LoadingScreen>
        </Providers>
      </body>
    </html>
  );
}