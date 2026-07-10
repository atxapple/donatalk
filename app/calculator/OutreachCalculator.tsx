// app/calculator/OutreachCalculator.tsx
//
// Client-side "cost of outreach + charitable impact" calculator for the
// Cluster C content surface. All outputs are arithmetic on the visitor's own
// inputs — no invented DonaTalk metrics (Charter Sec 6). First-party facts are
// truthful and mirror the live product: donations start at $10, DonaTalk takes
// a 4.9% fee on committed donations, and a declined meeting is never charged.
// The cold-outreach reply rate is an *industry estimate the visitor controls*
// (default ~1%, widely reported), used only to contrast volume — never claimed
// as a DonaTalk result.

'use client';

import { useState } from 'react';
import { styled } from '@/styles/stitches.config';

const FEE_RATE = 0.049; // 4.9% fee on committed donations (live product fact)
const MIN_DONATION = 10; // DonaTalk donations start at $10 (live product fact)

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function money(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 100 ? 2 : 0,
  });
}

/* --------------------------------------------------------------------- styles */

const Panel = styled('div', {
  width: '100%',
  maxWidth: '680px',
  marginTop: '$md',
  padding: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
});

const Field = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '10px 0',
  borderBottom: '1px solid #f0f1f3',
  '&:last-child': { borderBottom: 'none' },
});

const FieldLabel = styled('label', {
  fontSize: '14px',
  fontWeight: 600,
  color: '$dark',
});

const FieldHint = styled('span', {
  fontSize: '12px',
  color: '$darkgray',
  fontWeight: 400,
});

const InputRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$sm',
});

const Prefix = styled('span', {
  fontSize: '$md',
  fontWeight: 600,
  color: '$darkgray',
});

const NumberInput = styled('input', {
  flex: 1,
  width: '100%',
  padding: '10px 12px',
  fontSize: '$md',
  fontFamily: 'inherit',
  color: '$dark',
  border: '1px solid #dfe3e6',
  borderRadius: '$sm',
  backgroundColor: '$white',
  '&:focus': { outline: 'none', borderColor: '$heart' },
});

const ResultsGrid = styled('div', {
  width: '100%',
  maxWidth: '680px',
  marginTop: '$md',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '$md',
});

const ResultCard = styled('div', {
  padding: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '$white',
  variants: {
    highlight: {
      true: { borderColor: '$heart', backgroundColor: '#fff9f8' },
    },
  },
});

const ResultIcon = styled('div', { fontSize: '24px', lineHeight: 1, marginBottom: '6px' });
const ResultValue = styled('div', {
  fontSize: '$xl',
  fontWeight: 700,
  color: '$dark',
  lineHeight: 1.1,
  variants: { heart: { true: { color: '$heart' } } },
});
const ResultLabel = styled('div', { margin: '6px 0 0', fontSize: '13px', color: '$darkgray', lineHeight: 1.5 });

const Footnote = styled('p', {
  width: '100%',
  maxWidth: '680px',
  margin: '$md 0 0',
  fontSize: '12px',
  color: '$darkgray',
  lineHeight: 1.5,
  textAlign: 'center',
});

/* ----------------------------------------------------------------------- calc */

export default function OutreachCalculator() {
  const [meetings, setMeetings] = useState(10);
  const [donation, setDonation] = useState(25);
  const [replyRate, setReplyRate] = useState(1);

  const m = clampNumber(meetings, 1, 1000);
  const d = clampNumber(donation, MIN_DONATION, 10000);
  const r = clampNumber(replyRate, 0.1, 100);

  const impact = m * d; // donated to causes if every meeting is accepted
  const fee = impact * FEE_RATE; // what DonaTalk charges you
  const costPerMeeting = d * (1 + FEE_RATE);
  const coldContacts = Math.round(m / (r / 100)); // strangers to interrupt for m meetings

  return (
    <>
      <Panel>
        <Field>
          <FieldLabel htmlFor="calc-meetings">
            Meetings you want to book each month
          </FieldLabel>
          <InputRow>
            <NumberInput
              id="calc-meetings"
              type="number"
              min={1}
              max={1000}
              value={meetings}
              onChange={(e) => setMeetings(e.target.valueAsNumber)}
            />
          </InputRow>
        </Field>

        <Field>
          <FieldLabel htmlFor="calc-donation">
            Donation you&rsquo;ll offer per meeting{' '}
            <FieldHint>(you set it — from ${MIN_DONATION})</FieldHint>
          </FieldLabel>
          <InputRow>
            <Prefix aria-hidden>$</Prefix>
            <NumberInput
              id="calc-donation"
              type="number"
              min={MIN_DONATION}
              max={10000}
              value={donation}
              onChange={(e) => setDonation(e.target.valueAsNumber)}
            />
          </InputRow>
        </Field>

        <Field>
          <FieldLabel htmlFor="calc-reply">
            Cold-outreach reply rate{' '}
            <FieldHint>(industry estimate ~1% — adjust to yours)</FieldHint>
          </FieldLabel>
          <InputRow>
            <NumberInput
              id="calc-reply"
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              value={replyRate}
              onChange={(e) => setReplyRate(e.target.valueAsNumber)}
            />
            <Prefix aria-hidden>%</Prefix>
          </InputRow>
        </Field>
      </Panel>

      <ResultsGrid role="status" aria-live="polite">
        <ResultCard highlight>
          <ResultIcon aria-hidden>💝</ResultIcon>
          <ResultValue heart>{money(impact)}</ResultValue>
          <ResultLabel>
            donated to causes each month, if every meeting is accepted
          </ResultLabel>
        </ResultCard>

        <ResultCard>
          <ResultIcon aria-hidden>💸</ResultIcon>
          <ResultValue>{money(fee)}</ResultValue>
          <ResultLabel>
            your cost — DonaTalk&rsquo;s 4.9% fee on committed donations. Declined
            meetings cost you nothing.
          </ResultLabel>
        </ResultCard>

        <ResultCard>
          <ResultIcon aria-hidden>🎟️</ResultIcon>
          <ResultValue>{money(costPerMeeting)}</ResultValue>
          <ResultLabel>
            all-in per booked meeting ({money(d)} donation + fee) — and it funds a
            cause, not a gift card
          </ResultLabel>
        </ResultCard>

        <ResultCard>
          <ResultIcon aria-hidden>📨</ResultIcon>
          <ResultValue>{coldContacts.toLocaleString('en-US')}</ResultValue>
          <ResultLabel>
            cold messages you&rsquo;d send instead at {r}% reply — strangers
            interrupted, no cause helped
          </ResultLabel>
        </ResultCard>
      </ResultsGrid>

      <Footnote>
        Figures are estimates from your own inputs, not guaranteed results. The
        cold-message count assumes every reply became a meeting — optimistic for
        cold outreach, so the real gap is usually wider. DonaTalk&rsquo;s $10
        minimum and 4.9% fee are live product facts.
      </Footnote>
    </>
  );
}
