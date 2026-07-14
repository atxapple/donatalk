// app/for-listeners/page.tsx
//
// Cluster D (Listener-side) landing page — the counterpart to /pitchers for
// the person being pitched: the executive or operator whose calendar is the
// product. /listeners is the seller-facing browse directory, so a visitor
// arriving on listener-side intent ("get paid to take sales meetings") had no
// surface that answered them; this page is that surface. Static server
// component — no data reads, safe to prerender. First-party claims (you name
// the cause, you set the donation request from $10, donation committed only on
// accept, decline costs nothing, donation goes to the non-profit not to you,
// 4.9% fee on committed donations) mirror the live product per Charter Sec 6
// (truthful only). No tax, legal, or compliance representations — the bribe/
// ethics objection is answered with product mechanics and a pointer to the
// reader's own employer policies.

import type { Metadata } from 'next';
import Link from 'next/link';
import { styled } from '@/styles/stitches.config';
import PageWrapper from '@/components/layout/PageWrapper';
import { PageHeading, PageSubheading, PrimaryCTA, SecondaryHint } from '@/components/ui/profileCards';
import FurtherReading, { ARTICLES } from '@/components/FurtherReading';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'DonaTalk lets you get paid in donations to take sales meetings: sellers commit a donation to a non-profit you choose before they can pitch you. Accept only the pitches you want — your time funds your cause, and declining costs nothing.';

export const metadata: Metadata = {
  title: 'Get Paid in Donations to Take Sales Meetings',
  description: META_DESCRIPTION,
  keywords: [
    'get paid to take sales meetings',
    'get paid to take vendor meetings',
    'sales meetings for charity',
    'turn sales pitches into donations',
    'vendor meeting fatigue',
    'monetize your time for charity',
    'expert network alternative',
    'fund your cause',
  ],
  alternates: { canonical: '/for-listeners' },
  openGraph: {
    type: 'website',
    url: `${BASE}/for-listeners`,
    title: 'Get Paid in Donations to Take Sales Meetings',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Paid in Donations to Take Sales Meetings',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

/* ---------------------------------------------------------------- content */

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Name your cause and your price',
    body: 'Create a listener profile, pick the non-profit you want funded, and set the donation you ask for per meeting (from $10). You decide what your time is worth.',
  },
  {
    title: 'Sellers commit the donation up front',
    body: 'Anyone who wants to pitch you commits that donation to your cause before you ever take the meeting. No committed donation, no ask in your inbox.',
  },
  {
    title: 'Accept only the pitches you want',
    body: 'Accept and their donation goes to your chosen non-profit — your time just funded your cause. Decline and nothing is charged, to them or to you.',
  },
];

const REASONS: { icon: string; title: string; body: string }[] = [
  {
    icon: '🛡️',
    title: 'A filter that actually filters',
    body: 'Cold calls, cold emails, LinkedIn pitches — the volume is endless because sending one more costs the seller nothing. A committed donation puts a real cost on your attention, so only sellers who genuinely want your time get through.',
  },
  {
    icon: '💛',
    title: 'Your time funds your cause',
    body: 'The donation goes to a non-profit you choose — not to you. The meetings you were being chased for anyway become a funding stream for something you care about.',
  },
  {
    icon: '🤝',
    title: 'Nothing lands in your pocket',
    body: 'Expert networks and paid-consultation platforms pay you personally. On DonaTalk the money goes straight to your chosen non-profit, so saying yes is an act of giving, not a side income.',
  },
  {
    icon: '🎯',
    title: 'You stay in control',
    body: 'You see who is asking and what they want before anything happens. Accept the pitches worth your fifteen minutes, decline the rest — declining is free for everyone.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Is this a bribe?',
    a: 'No money ever goes to you. The donation is committed to a registered non-profit that you choose, and accepting a meeting obligates you to nothing beyond the conversation — no purchase, no endorsement, no follow-up. You are trading fifteen minutes of listening for a donation to your cause. If your employer has gifting or ethics policies, check how they treat charitable donations made on your behalf — the mechanics are transparent by design.',
  },
  {
    q: 'Am I obligated to buy anything if I accept?',
    a: 'No. The donation pays for the meeting, not for a deal. You listen, and the non-profit gets funded whether or not you ever want to hear from that seller again.',
  },
  {
    q: 'How is this different from expert networks and paid-consultation platforms?',
    a: 'Those platforms pay you personally for your time, usually as hourly consulting income. DonaTalk sends the money to a non-profit you choose instead — nothing is paid to you. It is also self-serve: you set your own donation request (from $10) and any professional can join, with no vetting panel, invite list, or fixed enterprise pricing.',
  },
  {
    q: 'How much should I ask sellers to donate?',
    a: 'You set it, with a $10 minimum, and you can change it anytime. Sellers already spend real money to get in front of buyers — booths, agencies, paid event meetings — so a donation request that reflects the value of your attention is normal, not greedy. Start where you are comfortable and adjust based on the asks you receive.',
  },
  {
    q: 'What happens when I decline a pitch?',
    a: 'Nothing is charged to anyone. The seller only pays when you accept, so declining costs them nothing and costs you nothing — there is no pressure to take meetings you do not want.',
  },
  {
    q: 'What does DonaTalk charge?',
    a: 'DonaTalk charges a 4.9% fee on donations that are committed when a meeting is accepted. Listeners never pay anything.',
  },
];

/* ------------------------------------------------------------------- JSON-LD */

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${BASE}/for-listeners#webpage`,
      url: `${BASE}/for-listeners`,
      name: 'Get paid in donations to take sales meetings',
      description: META_DESCRIPTION,
      isPartOf: { '@id': `${BASE}/#website` },
      breadcrumb: { '@id': `${BASE}/for-listeners#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${BASE}/for-listeners#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DonaTalk', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Get paid in donations to take sales meetings', item: `${BASE}/for-listeners` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}/for-listeners#faq`,
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

const PainBlock = styled('div', {
  width: '100%',
  maxWidth: '680px',
  marginTop: '$md',
  padding: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
});

const PainText = styled('p', {
  margin: '0 0 10px',
  fontSize: '$base',
  lineHeight: 1.6,
  color: '$darkgray',
  '&:last-child': { marginBottom: 0 },
  '& strong': { color: '$dark' },
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

export default function ForListenersPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <PageHeading>Get paid in donations to take sales meetings</PageHeading>
        <PageSubheading>Your time funds your cause.</PageSubheading>

        <Lede>
          Sellers already spend real money trying to reach you. DonaTalk redirects that spend:
          anyone who wants your time commits a <strong>donation to a non-profit you choose</strong>{' '}
          before they can pitch you — and you accept only the meetings you actually want.
        </Lede>

        <SectionHeading>Your inbox is not a sales funnel</SectionHeading>
        <PainBlock>
          <PainText>
            If you hold budget or make decisions, you know the drill: <strong>dozens of vendor
            meeting requests a week</strong> — cold calls from unknown numbers, sequenced emails,
            LinkedIn pitches, and now AI writing all three. The follow-ups do not stop, because
            sending one more message costs the seller nothing.
          </PainText>
          <PainText>
            Should you spend all day listening to sales pitches? <strong>Yes — if every one of them
            funds your cause.</strong> DonaTalk turns the pitch overload you already deal with into
            donations for a non-profit you pick, and hands you the accept/decline switch.
          </PainText>
        </PainBlock>

        <SectionHeading>How it works for listeners</SectionHeading>
        <Steps>
          {STEPS.map((s) => (
            <Step key={s.title}>
              <StepTitle>{s.title}</StepTitle>
              <StepBody>{s.body}</StepBody>
            </Step>
          ))}
        </Steps>

        <SectionHeading>Why executives listen on DonaTalk</SectionHeading>
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

        <FurtherReading links={[ARTICLES.donationBasedOutreach]} />

        <CtaRow>
          <SecondaryHint>Ready to make your calendar work for your cause?</SecondaryHint>
          <PrimaryCTA href="/listener/signup">Become a listener — fund your cause</PrimaryCTA>
          <SecondaryCTA href="/vs">See how donation-based outreach compares →</SecondaryCTA>
        </CtaRow>
      </Container>
    </PageWrapper>
  );
}
