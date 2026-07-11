// app/vs/page.tsx
//
// Cluster C ("donation-based outreach") category-defining comparison page.
// Static server component — no data reads, safe to prerender. Compares three
// *approaches* (cold email, paid gifting, donation-based outreach) at the
// category level; it never names or disparages a specific competitor product,
// per the Charter Sec 6 content rules (truthful, non-defamatory). First-party
// claims (donation-to-book, listener picks the cause, 4.9% fee, decline = no
// charge) mirror the live product.

import Link from 'next/link';
import type { Metadata } from 'next';
import { styled } from '@/styles/stitches.config';
import PageWrapper from '@/components/layout/PageWrapper';
import { PageHeading, PageSubheading, PrimaryCTA, SecondaryHint } from '@/components/ui/profileCards';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://app.donatalk.com';

const META_DESCRIPTION =
  'Donation-based outreach vs. cold email vs. paid gifting: how DonaTalk earns a warm meeting by funding a cause the recipient chooses — and why that beats a cold pitch or a gift card.';

export const metadata: Metadata = {
  title: 'Donation-Based Outreach vs. Cold Email',
  description: META_DESCRIPTION,
  keywords: [
    'donation-based outreach',
    'cold email alternative',
    'warm introductions',
    'book a meeting for charity',
    'charitable sales outreach',
    'paid gifting alternative',
    'authentic sales outreach',
    'AI outreach alternative',
    'outbound is dead alternatives',
  ],
  alternates: { canonical: '/vs' },
  openGraph: {
    type: 'article',
    url: `${BASE}/vs`,
    title: 'Donation-Based Outreach vs. Cold Email vs. Paid Gifting',
    description: META_DESCRIPTION,
    images: [{ url: '/logo%20horizontal%20with%20text.png', alt: 'DonaTalk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donation-Based Outreach vs. Cold Email vs. Paid Gifting',
    description: META_DESCRIPTION,
    images: ['/logo%20horizontal%20with%20text.png'],
  },
  robots: { index: true, follow: true },
};

/* ---------------------------------------------------------------- content */

type Approach = 'cold' | 'gifting' | 'donation';

const COLUMNS: { key: Approach; label: string; highlight?: boolean }[] = [
  { key: 'cold', label: 'Cold email / cold call' },
  { key: 'gifting', label: 'Paid gifting' },
  { key: 'donation', label: 'Donation-based outreach', highlight: true },
];

const ROWS: { dimension: string; cells: Record<Approach, string> }[] = [
  {
    dimension: 'What you send',
    cells: {
      cold: 'A pitch to someone who never asked to hear from you.',
      gifting: 'A gift card, swag, or lunch — a personal perk for the recipient.',
      donation: 'A donation to a non-profit the recipient chooses.',
    },
  },
  {
    dimension: 'Who benefits',
    cells: {
      cold: 'Only you, if it lands. Ignored messages help no one.',
      gifting: 'The recipient personally — which can feel transactional.',
      donation: 'A cause the recipient cares about — the reason they say yes.',
    },
  },
  {
    dimension: 'Reply dynamic',
    cells: {
      cold: 'Platform reply rates keep sliding — from ~5.1% (2024) to ~3.4% (2026); most cold campaigns sit in the low single digits.',
      gifting: 'Better than cold, but can read as a bribe and trip gifting policies.',
      donation: 'An opt-in, warm conversation that starts on goodwill.',
    },
  },
  {
    dimension: 'What it costs you',
    cells: {
      cold: 'Your time plus outreach tooling — paid whether or not anyone replies.',
      gifting: 'The full cost of the gift, spent up front regardless of the outcome.',
      donation: 'A donation you set (from $10). Declined? You pay nothing.',
    },
  },
  {
    dimension: 'Effect on your brand',
    cells: {
      cold: 'Easily dismissed as spam; erodes trust at scale.',
      gifting: 'Can feel like buying attention.',
      donation: 'Aligns your outreach with generosity — authenticity is the point.',
    },
  },
  {
    dimension: 'In the age of AI outreach',
    cells: {
      cold: 'AI can generate a "personalized" cold email in seconds, so a polished message no longer signals real effort or genuine intent.',
      gifting: 'A gift can be automated too, and still reads as buying attention.',
      donation: "A committed donation can't be faked by volume — putting real money behind a cause the recipient chose is a costly, genuine signal.",
    },
  },
];

const DIFFERENTIATORS: { icon: string; title: string; body: string }[] = [
  {
    icon: '🎯',
    title: 'The incentive points outward',
    body:
      "A gift rewards the person; a donation rewards a cause they already believe in. That shifts the ask from “what's in it for me” to “what can we do together.”",
  },
  {
    icon: '🤝',
    title: 'It starts warm, not cold',
    body:
      'The recipient opts in by picking who gets the donation. By the time you talk, the conversation is invited — not interrupted.',
  },
  {
    icon: '💸',
    title: 'You only pay for a real yes',
    body:
      'The donation is committed when a listener accepts. If they decline, nothing is charged — so budget follows outcomes, not sent volume.',
  },
  {
    icon: '🛡️',
    title: "A signal AI can't fake",
    body:
      'When any seller can auto-generate a personal-looking email, the email stops being a signal. A donation you actually commit is costly to fake — and that is what makes authentic sales outreach land in a world of infinite AI messages.',
  },
];

const STEPS: string[] = [
  'Find a person on DonaTalk and a cause they support that you want to back.',
  'Commit a donation (from $10) to request 15 minutes of their time.',
  'They accept → their chosen charity gets funded; they decline → you pay nothing.',
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is donation-based outreach?',
    a: "Donation-based outreach is a way to earn a business conversation by committing a charitable donation instead of sending a cold pitch. On DonaTalk, a pitcher donates to a non-profit the recipient chooses in exchange for a short, opt-in meeting.",
  },
  {
    q: 'How is it different from cold email?',
    a: 'Cold email interrupts a stranger, and its reply rate keeps falling — platform averages dropped from ~5.1% (2024) to ~3.4% (2026), with most cold campaigns landing in the low single digits (about 1-3%). Donation-based outreach gives the recipient a reason to say yes — funding a cause they care about — so the conversation starts warm and invited rather than unsolicited.',
  },
  {
    q: 'Is this just paid gifting with extra steps?',
    a: "No. Paid gifting rewards the recipient personally, which can feel transactional and may conflict with corporate gifting policies. A donation goes to a non-profit the recipient selects, so the value lands on a cause rather than a person.",
  },
  {
    q: 'What does it cost, and what if the meeting is declined?',
    a: 'You set the donation amount (from $10). DonaTalk charges a 4.9% fee on committed donations. If the recipient declines, nothing is charged — you only pay when a meeting is accepted.',
  },
  {
    q: 'Does donation-based outreach still work now that AI writes cold emails?',
    a: "That is exactly why it works. AI can generate an unlimited number of personalized-looking cold messages, so a polished email no longer proves genuine interest or effort. A committed donation is costly to fake — you are putting real money behind a cause the recipient chose — so it stands out as an authentic signal in a way an AI-written email cannot.",
  },
];

/* ------------------------------------------------------------------- JSON-LD */

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${BASE}/vs#webpage`,
      url: `${BASE}/vs`,
      name: 'Donation-Based Outreach vs. Cold Email vs. Paid Gifting',
      description: META_DESCRIPTION,
      isPartOf: { '@id': `${BASE}/#website` },
      breadcrumb: { '@id': `${BASE}/vs#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${BASE}/vs#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'DonaTalk', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Donation-based outreach vs. cold email', item: `${BASE}/vs` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE}/vs#faq`,
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

const TableScroll = styled('div', {
  width: '100%',
  marginTop: '$md',
  overflowX: 'auto',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
});

const Table = styled('table', {
  width: '100%',
  minWidth: '640px',
  borderCollapse: 'collapse',
  fontSize: '14px',
  backgroundColor: '$white',
});

const Th = styled('th', {
  padding: '12px 14px',
  textAlign: 'left',
  fontWeight: 700,
  color: '$dark',
  backgroundColor: '#f8f6f4',
  borderBottom: '1px solid #e8eaec',
  verticalAlign: 'bottom',
  variants: {
    highlight: { true: { backgroundColor: '#fff5f4', color: '$heart' } },
    corner: { true: { backgroundColor: '$white' } },
  },
});

const Td = styled('td', {
  padding: '12px 14px',
  color: '$dark',
  lineHeight: 1.5,
  borderBottom: '1px solid #f0f1f3',
  verticalAlign: 'top',
  variants: {
    highlight: { true: { backgroundColor: '#fff9f8' } },
  },
});

const RowHeader = styled('th', {
  padding: '12px 14px',
  textAlign: 'left',
  fontWeight: 600,
  color: '$darkgray',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #f0f1f3',
  verticalAlign: 'top',
});

const CardGrid = styled('div', {
  width: '100%',
  marginTop: '$md',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '$md',
});

const DiffCard = styled('div', {
  padding: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
});

const DiffIcon = styled('div', { fontSize: '28px', lineHeight: 1, marginBottom: '$sm' });
const DiffTitle = styled('h3', { margin: '0 0 6px', fontSize: '$md', fontWeight: 700, color: '$dark' });
const DiffBody = styled('p', { margin: 0, fontSize: '14px', lineHeight: 1.55, color: '$darkgray' });

const Steps = styled('ol', {
  width: '100%',
  maxWidth: '640px',
  margin: '$md 0 0',
  padding: '14px 16px 14px 34px',
  backgroundColor: '#f8f6f4',
  border: '1px solid #eee',
  borderRadius: '$md',
  fontSize: '$base',
  color: '$dark',
  lineHeight: 1.6,
  '& li': { marginBottom: '6px' },
  '& strong': { color: '$heart' },
});

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

export default function VsPage() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <PageHeading>Donation-based outreach vs. cold email vs. paid gifting</PageHeading>
        <PageSubheading>What if every sales call also helped a non-profit?</PageSubheading>

        <Lede>
          Cold outreach interrupts a stranger. A gift buys their attention.{' '}
          <strong>Donation-based outreach</strong> earns a warm meeting by funding a cause the
          recipient chooses — so the conversation starts on goodwill, and you only pay when they
          say yes.
        </Lede>

        <SectionHeading>How the three approaches compare</SectionHeading>
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th corner scope="col">
                  &nbsp;
                </Th>
                {COLUMNS.map((c) => (
                  <Th key={c.key} highlight={c.highlight} scope="col">
                    {c.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.dimension}>
                  <RowHeader scope="row">{row.dimension}</RowHeader>
                  {COLUMNS.map((c) => (
                    <Td key={c.key} highlight={c.highlight}>
                      {row.cells[c.key]}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>

        <SectionHeading>Why donation-based outreach is different</SectionHeading>
        <CardGrid>
          {DIFFERENTIATORS.map((d) => (
            <DiffCard key={d.title}>
              <DiffIcon aria-hidden>{d.icon}</DiffIcon>
              <DiffTitle>{d.title}</DiffTitle>
              <DiffBody>{d.body}</DiffBody>
            </DiffCard>
          ))}
        </CardGrid>

        <SectionHeading>How it works on DonaTalk</SectionHeading>
        <Steps>
          {STEPS.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </Steps>

        <SectionHeading>Frequently asked</SectionHeading>
        <FaqList>
          {FAQ.map((f) => (
            <FaqItem key={f.q}>
              <FaqQ>{f.q}</FaqQ>
              <FaqA>{f.a}</FaqA>
            </FaqItem>
          ))}
        </FaqList>

        <CtaRow>
          <SecondaryHint>Ready to try warm, charitable outreach?</SecondaryHint>
          <PrimaryCTA href="/listeners">Browse people to pitch →</PrimaryCTA>
          <SecondaryCTA href="/pitchers">How donation-based outreach works for sellers →</SecondaryCTA>
          <SecondaryCTA href="/calculator">Estimate your donation impact →</SecondaryCTA>
          <SecondaryCTA href="/pitcher/signup">Start pitching — join as a pitcher</SecondaryCTA>
        </CtaRow>
      </Container>
    </PageWrapper>
  );
}
