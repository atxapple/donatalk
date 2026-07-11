// components/FurtherReading.tsx
//
// A small "Further reading" block that links the app's Cluster C surfaces
// (/vs, /calculator, /listeners) to the donation-based-outreach articles that
// are published live on the WordPress SEO home (donatalk.com). Those posts went
// live 2026-07-11 but had zero inbound links from the app, so this gives them
// crawl paths, do-follow link equity between our own properties, and a human
// discovery route. Static content only — server-rendered, no interactivity.
//
// All three articles are first-party DonaTalk content (Charter Sec 6: truthful);
// anchor text is keyword-rich but describes the article honestly.

import { styled } from '@/styles/stitches.config';

const WP_BASE = 'https://donatalk.com';

// The three live cluster posts. Slugs verified live (200, in the WP sitemap).
export const ARTICLES = {
  coldEmailAlternatives: {
    href: `${WP_BASE}/cold-email-alternatives/`,
    label: 'Cold email alternatives that actually earn replies',
    blurb: 'Why cold reply rates keep sliding, and the warmer channels that beat them.',
  },
  warmIntroductions: {
    href: `${WP_BASE}/how-to-get-warm-introductions/`,
    label: 'How to get warm introductions (with copy-paste templates)',
    blurb: 'A simple double-opt-in ask, plus templates for when you have no mutual connection.',
  },
  donationBasedOutreach: {
    href: `${WP_BASE}/what-is-donation-based-outreach/`,
    label: 'What is donation-based outreach? A plain-English explainer',
    blurb: 'The definition, how the reply math works, and how it differs from paid gifting.',
  },
} as const;

export type ReadingLink = { href: string; label: string; blurb: string };

const Section = styled('section', {
  width: '100%',
  maxWidth: '680px',
  marginTop: '$lg',
});

const Heading = styled('h2', {
  width: '100%',
  margin: '0 0 $sm',
  fontSize: '$xl',
  fontWeight: 700,
  color: '$dark',
  textAlign: 'center',
});

const List = styled('ul', {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '$sm',
});

const Item = styled('li', {
  padding: '14px 16px',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
  transition: 'border-color 0.15s ease, background-color 0.15s ease',
  '&:hover': { borderColor: '$heart', backgroundColor: '#fff9f8' },
});

const ItemLink = styled('a', {
  display: 'block',
  fontSize: '$md',
  fontWeight: 700,
  color: '$heart',
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
});

const ItemBlurb = styled('p', {
  margin: '4px 0 0',
  fontSize: '14px',
  lineHeight: 1.5,
  color: '$darkgray',
});

export default function FurtherReading({
  heading = 'Further reading on donation-based outreach',
  links,
}: {
  heading?: string;
  links: ReadingLink[];
}) {
  return (
    <Section>
      <Heading>{heading}</Heading>
      <List>
        {links.map((l) => (
          <Item key={l.href}>
            <ItemLink href={l.href} rel="noopener">
              {l.label}
            </ItemLink>
            <ItemBlurb>{l.blurb}</ItemBlurb>
          </Item>
        ))}
      </List>
    </Section>
  );
}
