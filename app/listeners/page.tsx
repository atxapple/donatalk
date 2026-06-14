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
import { Listener } from '@/types/listener';

// The client Firestore SDK reads the live `listeners` collection per request
// (anonymous read), so opt out of static prerendering.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Browse listeners | DonaTalk',
  description:
    'Find a person worth pitching. Browse real people on DonaTalk and the causes they support — your donation books 15 minutes of their time.',
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

export default async function BrowseListenersPage() {
  const listeners = await getLiveListeners();

  return (
    <PageWrapper>
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

        <CtaRow>
          <SecondaryHint>Want in?</SecondaryHint>
          <PrimaryCTA href="/listener/signup">Get pitched — list yourself →</PrimaryCTA>
          <SecondaryCTA href="/pitcher/signup">Pitch someone — join as a pitcher</SecondaryCTA>
        </CtaRow>
      </BrowseContainer>
    </PageWrapper>
  );
}
