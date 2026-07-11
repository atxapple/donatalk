// app/calculator/page.tsx
//
// Cluster C ("donation-based outreach") conversion asset: an outreach cost +
// charitable-impact calculator. Server component so metadata and JSON-LD are
// server-rendered for SEO; the interactive math lives in the client child
// <OutreachCalculator/>. No data reads — safe to prerender. Category-level
// framing only (no named competitors) per Charter Sec 6; first-party claims
// ($10 minimum, 4.9% fee, decline = no charge) mirror the live product.

import Link from 'next/link';
import type { Metadata } from 'next';
import { styled } from '@/styles/stitches.config';
import PageWrapper from '@/components/layout/PageWrapper';
import { PageHeading, PageSubheading, PrimaryCTA, SecondaryHint } from '@/components/ui/profileCards';
import FurtherReading, { ARTICLES } from '@/components/FurtherReading';
import OutreachCalculator from './OutreachCalculator';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'Free calculator: see what booking meetings with donation-based outreach costs you (a 4.9% fee, nothing when declined), how much it donates to causes, and how many cold messages you would send instead.';

export const metadata: Metadata = {
  title: 'Cold Outreach Cost & Charitable Impact Calculator',
  description: META_DESCRIPTION,
  keywords: [
    'cold outreach cost calculator',
    'cost of cold email',
    'donation-based outreach',
    'cost per meeting booked',
    'warm introduction cost',
    'charitable sales outreach',
  ],
  alternates: { canonical: '/calculator' },
  openGraph: {
    type: 'website',
    url: `${BASE}/calculator`,
    title: 'Cold Outreach Cost & Charitable Impact Calculator',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cold Outreach Cost & Charitable Impact Calculator',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

/* ------------------------------------------------------------------- content */

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What does donation-based outreach cost?',
    a: 'You set the donation you offer per meeting (from $10). DonaTalk charges a 4.9% fee on donations that are committed when a meeting is accepted. If the recipient declines, nothing is charged — so your spend follows real conversations, not sent volume.',
  },
  {
    q: 'How is the cost per meeting calculated?',
    a: 'Cost per booked meeting is your chosen donation plus the 4.9% fee on it. For a $25 donation that is $26.23 all-in — and the $25 funds a non-profit the recipient chose, rather than a gift card or swag.',
  },
  {
    q: 'Where does the cold-outreach comparison come from?',
    a: 'The cold-message count is arithmetic on the reply rate you enter (defaulting to the widely reported ~1%). It assumes every reply turned into a meeting, which is optimistic for cold outreach — so the real volume gap is usually larger, not smaller. It is an estimate from your inputs, not a guaranteed result.',
  },
  {
    q: 'Is the donation tax-deductible?',
    a: 'DonaTalk directs donations to the non-profit a recipient chooses. Whether a given donation is tax-deductible for you depends on the organization and your own tax situation — check with the non-profit and a tax professional. DonaTalk does not provide tax advice.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${BASE}/calculator#app`,
      name: 'DonaTalk Outreach Cost & Impact Calculator',
      url: `${BASE}/calculator`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: META_DESCRIPTION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@id': `${BASE}/#website` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${BASE}/calculator#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DonaTalk', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Outreach cost & impact calculator', item: `${BASE}/calculator` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}/calculator#faq`,
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

/* -------------------------------------------------------------------- styles */

const Container = styled('div', {
  width: '100%',
  maxWidth: '760px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '0 $md',
});

const Lede = styled('p', {
  width: '100%',
  maxWidth: '640px',
  margin: '$sm 0 0',
  fontSize: '$md',
  lineHeight: 1.6,
  color: '$dark',
  textAlign: 'center',
  '& strong': { color: '$heart' },
});

const SectionHeading = styled('h2', {
  width: '100%',
  maxWidth: '640px',
  margin: '$lg 0 $sm',
  fontSize: '$xl',
  fontWeight: 700,
  color: '$dark',
  textAlign: 'center',
});

const FaqList = styled('div', { width: '100%', maxWidth: '680px', marginTop: '$sm' });
const FaqItem = styled('div', {
  padding: '14px 0',
  borderBottom: '1px solid #f0f1f3',
  '&:last-child': { borderBottom: 'none' },
});
const FaqQ = styled('h3', { margin: '0 0 4px', fontSize: '$md', fontWeight: 700, color: '$dark' });
const FaqA = styled('p', { margin: 0, fontSize: '$base', lineHeight: 1.6, color: '$darkgray' });

const CtaRow = styled('div', {
  width: '100%',
  maxWidth: '640px',
  marginTop: '$lg',
  display: 'flex',
  flexDirection: 'column',
  gap: '$sm',
});

const SecondaryCTA = styled(Link, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: '14px 20px',
  borderRadius: '$md',
  backgroundColor: '$white',
  color: '$heart',
  border: '1px solid $heart',
  fontSize: '$md',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'background-color 0.15s ease',
  '&:hover': { backgroundColor: '#fff5f4' },
});

/* ---------------------------------------------------------------------- page */

export default function CalculatorPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <PageHeading>What does your outreach really cost — and who does it help?</PageHeading>
        <PageSubheading>What if every sales call also helped a non-profit?</PageSubheading>

        <Lede>
          Cold outreach spends your time and budget interrupting strangers.{' '}
          <strong>Donation-based outreach</strong> turns the same goal into a warm
          meeting and a gift to a cause the recipient chose. Set your numbers and
          see the difference.
        </Lede>

        <OutreachCalculator />

        <SectionHeading>Frequently asked</SectionHeading>
        <FaqList>
          {FAQ.map((f) => (
            <FaqItem key={f.q}>
              <FaqQ>{f.q}</FaqQ>
              <FaqA>{f.a}</FaqA>
            </FaqItem>
          ))}
        </FaqList>

        <FurtherReading
          links={[ARTICLES.coldEmailAlternatives, ARTICLES.donationBasedOutreach]}
        />

        <CtaRow>
          <SecondaryHint>Ready to turn outreach into impact?</SecondaryHint>
          <PrimaryCTA href="/listeners">Browse people to pitch →</PrimaryCTA>
          <SecondaryCTA href="/vs">See how donation-based outreach compares →</SecondaryCTA>
        </CtaRow>
      </Container>
    </PageWrapper>
  );
}
