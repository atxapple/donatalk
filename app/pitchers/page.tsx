// app/pitchers/page.tsx
//
// Cluster C ("donation-based outreach") seller-side landing page. This is the
// Pitcher counterpart to /listeners: /listeners is the Listener-side browse +
// conversion surface, while /pitchers is the entry page for the B2B seller ICP
// — the person who wants to book warm meetings by funding a cause instead of
// sending another cold email. Static server component — no data reads, safe to
// prerender. First-party claims (donation-to-book from $10, listener picks the
// cause, 4.9% fee on committed donations, decline = no charge) mirror the live
// product per Charter Sec 6 (truthful only). Cold-outreach framing uses the
// sourced collapsing-average (~5.1% 2024 -> ~3.4% 2026; 1-3% as the warm-vs-cold
// comparison range) per the 2026-07-10 DECISIONS convention; the AI-authenticity
// wedge is argument-based, no unverified third-party statistics.

import Link from 'next/link';
import type { Metadata } from 'next';
import { styled } from '@/styles/stitches.config';
import PageWrapper from '@/components/layout/PageWrapper';
import { PageHeading, PageSubheading, PrimaryCTA, SecondaryHint } from '@/components/ui/profileCards';
import FurtherReading, { ARTICLES } from '@/components/FurtherReading';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'DonaTalk is donation-based outreach for B2B sellers: book a warm meeting by committing a donation to a cause the recipient chooses, instead of sending another cold email. You only pay when they say yes — decline costs nothing.';

export const metadata: Metadata = {
  title: 'Donation-Based Outreach for Sellers — Book Warm Meetings',
  description: META_DESCRIPTION,
  keywords: [
    'donation-based outreach',
    'book a meeting for charity',
    'cold email alternative',
    'warm introduction alternative',
    'how to book B2B meetings',
    'authentic sales outreach',
    'AI outreach alternative',
    'charitable sales outreach',
  ],
  alternates: { canonical: '/pitchers' },
  openGraph: {
    type: 'website',
    url: `${BASE}/pitchers`,
    title: 'Donation-Based Outreach for Sellers — Book Warm Meetings',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donation-Based Outreach for Sellers — Book Warm Meetings',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

/* ---------------------------------------------------------------- content */

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Find someone worth pitching',
    body: 'Browse people on DonaTalk and the causes they support. Pick a person you want to reach and a cause you are glad to back.',
  },
  {
    title: 'Commit a donation to ask for 15 minutes',
    body: 'You set the amount (from $10). The donation is only committed if they accept — so your ask carries real intent, not just another message in the inbox.',
  },
  {
    title: 'They say yes, their charity gets funded',
    body: 'Accept and their chosen non-profit is funded and you get the meeting. Decline and nothing is charged — you only pay for a real yes.',
  },
];

const REASONS: { icon: string; title: string; body: string }[] = [
  {
    icon: '🤝',
    title: 'Start warm, not cold',
    body: 'The recipient opts in by choosing the cause your donation supports. By the time you talk, the conversation is invited — not an interruption they never asked for.',
  },
  {
    icon: '💸',
    title: 'Only pay for a real yes',
    body: 'The donation is committed when a listener accepts. Decline costs nothing, so your budget follows booked meetings instead of sent volume.',
  },
  {
    icon: '🛡️',
    title: 'A signal AI can’t fake',
    body: 'Any seller can now auto-generate a personal-looking cold email in seconds, so a polished message no longer proves genuine effort. A donation you actually commit is costly to fake — that is what makes your outreach land as authentic.',
  },
  {
    icon: '🎯',
    title: 'Works in any vertical',
    body: 'Self-serve and open to every B2B seller — pick who you want to reach and the cause to back. No enterprise gatekeeper, no invite list, no minimum team size.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How does pitching someone on DonaTalk work?',
    a: 'Find a person worth pitching and a cause they support, commit a donation (from $10) to request 15 minutes of their time, and send your ask. If they accept, their chosen non-profit gets funded and you get the meeting; if they decline, nothing is charged.',
  },
  {
    q: 'What does it cost, and what if they decline?',
    a: 'You set the donation you offer (from $10). DonaTalk charges a 4.9% fee on donations that are committed when a meeting is accepted. If the recipient declines, nothing is charged — you only pay for a real yes.',
  },
  {
    q: 'Why is this better than another cold email?',
    a: 'Cold email interrupts a stranger, and its reply rate keeps sliding — platform averages fell from about 5.1% (2024) to about 3.4% (2026), with most cold campaigns landing in the low single digits (roughly 1-3%). Donation-based outreach gives the recipient a reason to say yes — funding a cause they care about — so the conversation starts warm and invited rather than unsolicited.',
  },
  {
    q: 'Is this just paid gifting with extra steps?',
    a: 'No. Paid gifting rewards the recipient personally, which can feel transactional and may conflict with corporate gifting policies. A donation goes to a non-profit the recipient selects, so the value lands on a cause rather than a person.',
  },
  {
    q: 'Does this still work now that AI writes cold emails?',
    a: 'That is exactly why it works. AI can generate an unlimited number of personalized-looking cold messages, so a polished email no longer proves genuine interest or effort. A committed donation is costly to fake — you are putting real money behind a cause the recipient chose — so it stands out as an authentic signal in a way an AI-written email cannot.',
  },
];

/* ------------------------------------------------------------------- JSON-LD */

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${BASE}/pitchers#webpage`,
      url: `${BASE}/pitchers`,
      name: 'Donation-based outreach for B2B sellers',
      description: META_DESCRIPTION,
      isPartOf: { '@id': `${BASE}/#website` },
      breadcrumb: { '@id': `${BASE}/pitchers#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${BASE}/pitchers#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DonaTalk', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Donation-based outreach for sellers', item: `${BASE}/pitchers` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}/pitchers#faq`,
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
  maxWidth: '860px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '0 $md',
});

const Lede = styled('p', {
  width: '100%',
  maxWidth: '680px',
  margin: '$sm 0 0',
  fontSize: '$md',
  lineHeight: 1.6,
  color: '$dark',
  textAlign: 'center',
  '& strong': { color: '$heart' },
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

const Steps = styled('ol', {
  width: '100%',
  maxWidth: '680px',
  margin: '$md 0 0',
  padding: '0',
  listStyle: 'none',
  counterReset: 'step',
  display: 'flex',
  flexDirection: 'column',
  gap: '$sm',
});

const Step = styled('li', {
  counterIncrement: 'step',
  position: 'relative',
  padding: '14px 16px 14px 52px',
  backgroundColor: '#f8f6f4',
  border: '1px solid #eee',
  borderRadius: '$md',
  '&::before': {
    content: 'counter(step)',
    position: 'absolute',
    left: '14px',
    top: '14px',
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '$heart',
    color: '$white',
    fontSize: '14px',
    fontWeight: 700,
  },
});

const StepTitle = styled('h3', { margin: '0 0 4px', fontSize: '$md', fontWeight: 700, color: '$dark' });
const StepBody = styled('p', { margin: 0, fontSize: '14px', lineHeight: 1.55, color: '$darkgray' });

const CardGrid = styled('div', {
  width: '100%',
  marginTop: '$md',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '$md',
});

const ReasonCard = styled('div', {
  padding: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
});

const ReasonIcon = styled('div', { fontSize: '28px', lineHeight: 1, marginBottom: '$sm' });
const ReasonTitle = styled('h3', { margin: '0 0 6px', fontSize: '$md', fontWeight: 700, color: '$dark' });
const ReasonBody = styled('p', { margin: 0, fontSize: '14px', lineHeight: 1.55, color: '$darkgray' });

const FaqList = styled('div', { width: '100%', maxWidth: '680px', marginTop: '$md' });

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

export default function PitchersPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <PageHeading>Book warm meetings by giving to a cause</PageHeading>
        <PageSubheading>What if every sales call also helped a non-profit?</PageSubheading>

        <Lede>
          Cold email interrupts a stranger and reply rates keep sliding.{' '}
          <strong>Donation-based outreach</strong> earns you a warm, opt-in meeting by funding a
          cause the recipient chooses — so your ask starts on goodwill, and you only pay when they
          say yes.
        </Lede>

        <SectionHeading>How pitching works on DonaTalk</SectionHeading>
        <Steps>
          {STEPS.map((s) => (
            <Step key={s.title}>
              <StepTitle>{s.title}</StepTitle>
              <StepBody>{s.body}</StepBody>
            </Step>
          ))}
        </Steps>

        <SectionHeading>Why sellers use donation-based outreach</SectionHeading>
        <CardGrid>
          {REASONS.map((r) => (
            <ReasonCard key={r.title}>
              <ReasonIcon aria-hidden>{r.icon}</ReasonIcon>
              <ReasonTitle>{r.title}</ReasonTitle>
              <ReasonBody>{r.body}</ReasonBody>
            </ReasonCard>
          ))}
        </CardGrid>

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
          links={[
            ARTICLES.coldEmailAlternatives,
            ARTICLES.warmIntroductions,
            ARTICLES.donationBasedOutreach,
          ]}
        />

        <CtaRow>
          <SecondaryHint>Ready to turn a donation into a warm meeting?</SecondaryHint>
          <PrimaryCTA href="/listeners">Browse people to pitch →</PrimaryCTA>
          <SecondaryCTA href="/calculator">Estimate your donation impact →</SecondaryCTA>
          <SecondaryCTA href="/vs">See how donation-based outreach compares →</SecondaryCTA>
          <SecondaryCTA href="/pitcher/signup">Start pitching — join as a pitcher</SecondaryCTA>
        </CtaRow>
      </Container>
    </PageWrapper>
  );
}
