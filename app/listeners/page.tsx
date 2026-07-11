// app/listeners/page.tsx

import Link from 'next/link';
import type { Metadata } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/clientApp';
import { styled } from '@/styles/stitches.config';
import PageWrapper from '@/components/layout/PageWrapper';
import {
  PageHeading,
  PageSubheading,
  PrimaryCTA,
  SecondaryHint,
} from '@/components/ui/profileCards';
import FurtherReading, { ARTICLES } from '@/components/FurtherReading';
import { Listener } from '@/types/listener';

// The client Firestore SDK reads the live `listeners` collection per request
// (anonymous read), so opt out of static prerendering.
export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'Browse real people on DonaTalk and the causes they support, then book 15 minutes with a donation instead of a cold pitch. Donation-based outreach: they say yes, their charity gets funded, and if they decline you pay nothing.';

// /listeners is the app's primary Cluster C ("donation-based outreach") landing
// + conversion surface, so it carries full metadata + JSON-LD parity with /vs
// and /calculator. Claims are first-party and mirror the live product ($10
// minimum, 4.9% fee, decline = no charge) per Charter Sec 6 (truthful only).
export const metadata: Metadata = {
  title: 'Browse People to Pitch — Donation-Based Outreach',
  description: META_DESCRIPTION,
  keywords: [
    'donation-based outreach',
    'book a meeting for charity',
    'pitch someone for a cause',
    'warm introduction alternative',
    'charitable sales outreach',
    'donate to book a meeting',
  ],
  alternates: { canonical: '/listeners' },
  openGraph: {
    type: 'website',
    url: `${BASE}/listeners`,
    title: 'Browse People to Pitch — Donation-Based Outreach',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse People to Pitch — Donation-Based Outreach',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

/* ------------------------------------------------------------------- content */

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is donation-based outreach?',
    a: 'Donation-based outreach is a way to earn a business conversation by committing a charitable donation instead of sending a cold pitch. On DonaTalk you pick a person and a cause they support, commit a donation to request 15 minutes of their time, and the conversation starts warm and invited rather than unsolicited.',
  },
  {
    q: 'How does pitching someone on DonaTalk work?',
    a: 'Find a person worth pitching and a cause they care about, commit a donation (from $10) to request 15 minutes, and send your ask. If they accept, their chosen non-profit gets funded and you get the meeting; if they decline, nothing is charged.',
  },
  {
    q: 'What does it cost, and what if they decline?',
    a: 'You set the donation you offer (from $10). DonaTalk charges a 4.9% fee on donations that are committed when a meeting is accepted. If the recipient declines, nothing is charged — you only pay for a real yes.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${BASE}/listeners#webpage`,
      url: `${BASE}/listeners`,
      name: 'Browse people to pitch on DonaTalk',
      description: META_DESCRIPTION,
      isPartOf: { '@id': `${BASE}/#website` },
      breadcrumb: { '@id': `${BASE}/listeners#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${BASE}/listeners#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DonaTalk', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Browse people to pitch', item: `${BASE}/listeners` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}/listeners#faq`,
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

type BrowseListener = Listener & { uid: string };

async function getLiveListeners(): Promise<BrowseListener[]> {
  try {
    const snapshot = await getDocs(collection(firestore, 'listeners'));
    return snapshot.docs
      .map((d) => ({ uid: d.id, ...(d.data() as Listener) }))
      .filter((l) => l.isSetUp !== false && !l.deletedAt);
  } catch (err) {
    console.error('[Browse Listeners Error]', err);
    return [];
  }
}

function truncate(text: string, max = 140): string {
  const t = (text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

const BrowseContainer = styled('div', {
  width: '100%',
  maxWidth: '900px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '0 $md',
});

const Steps = styled('ol', {
  width: '100%',
  maxWidth: '640px',
  margin: '$md 0 0',
  padding: '14px 16px 14px 34px',
  backgroundColor: '#f8f6f4',
  border: '1px solid #eee',
  borderRadius: '$md',
  fontSize: '14px',
  color: '$dark',
  lineHeight: 1.55,
  '& li': { marginBottom: '4px' },
  '& strong': { color: '$heart' },
});

const Grid = styled('div', {
  width: '100%',
  marginTop: '$lg',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '$md',
});

const ListenerCard = styled(Link, {
  display: 'flex',
  flexDirection: 'column',
  gap: '$sm',
  padding: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '$white',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
  textDecoration: 'none',
  color: '$dark',
  transition: 'transform 0.05s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  '&:hover': {
    borderColor: '$heart',
    boxShadow: '0 10px 24px rgba(231, 76, 60, 0.12)',
  },
  '&:active': { transform: 'translateY(1px)' },
});

const CardName = styled('div', {
  fontSize: '$md',
  fontWeight: 700,
  color: '$dark',
  lineHeight: 1.2,
});

const CardIntro = styled('p', {
  margin: 0,
  fontSize: '14px',
  color: '$darkgray',
  lineHeight: 1.5,
  flex: 1,
});

const CardStat = styled('div', {
  display: 'inline-flex',
  alignSelf: 'flex-start',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  borderRadius: '$sm',
  backgroundColor: '#fafbfc',
  border: '1px solid #e8eaec',
  fontSize: '13px',
  fontWeight: 600,
  color: '$dark',
  '& strong': { color: '$heart' },
});

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

const EmptyState = styled('div', {
  width: '100%',
  maxWidth: '640px',
  marginTop: '$lg',
  padding: '$lg $md',
  textAlign: 'center',
  borderRadius: '$md',
  border: '1px dashed #e8eaec',
  backgroundColor: '#fafbfc',
  color: '$darkgray',
  fontSize: '$base',
  lineHeight: 1.55,
});

const SectionHeading = styled('h2', {
  width: '100%',
  maxWidth: '680px',
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

export default async function BrowseListenersPage() {
  const listeners = await getLiveListeners();

  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BrowseContainer>
        <PageHeading>Find someone worth pitching</PageHeading>
        <PageSubheading>
          Real people lending 15 minutes — your donation goes to the cause they care about.
        </PageSubheading>

        <Steps>
          <li>Find a person and a cause you want to support.</li>
          <li>Commit a <strong>$10+ donation</strong> to book 15 minutes.</li>
          <li>They accept &rarr; <strong>their charity gets paid</strong>; decline &rarr; you pay nothing.</li>
        </Steps>

        {listeners.length === 0 ? (
          <EmptyState>
            No listeners are available to pitch just yet. Be the first to join — list yourself to
            get pitched, or come back soon.
          </EmptyState>
        ) : (
          <Grid>
            {listeners.map((l) => (
              <ListenerCard key={l.uid} href={`/listener/${l.uid}`}>
                <CardName>{l.fullName}</CardName>
                {l.intro && l.intro.trim() ? (
                  <CardIntro>{truncate(l.intro)}</CardIntro>
                ) : (
                  <CardIntro>On DonaTalk — pitch them to support their cause.</CardIntro>
                )}
                <CardStat>
                  💝&nbsp;<strong>${l.donation} min donation</strong>
                </CardStat>
              </ListenerCard>
            ))}
          </Grid>
        )}

        <SectionHeading>How donation-based outreach works</SectionHeading>
        <FaqList>
          {FAQ.map((f) => (
            <FaqItem key={f.q}>
              <FaqQ>{f.q}</FaqQ>
              <FaqA>{f.a}</FaqA>
            </FaqItem>
          ))}
        </FaqList>

        <FurtherReading
          links={[ARTICLES.donationBasedOutreach, ARTICLES.warmIntroductions]}
        />

        <CtaRow>
          <SecondaryHint>Want in?</SecondaryHint>
          <PrimaryCTA href="/listener/signup">Get pitched — list yourself →</PrimaryCTA>
          <SecondaryCTA href="/pitcher/signup">Pitch someone — join as a pitcher</SecondaryCTA>
          <SecondaryCTA href="/vs">See how donation-based outreach compares →</SecondaryCTA>
          <SecondaryCTA href="/calculator">Estimate your donation impact →</SecondaryCTA>
        </CtaRow>
      </BrowseContainer>
    </PageWrapper>
  );
}
