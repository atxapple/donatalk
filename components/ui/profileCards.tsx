import { Fragment, ReactNode } from 'react';
import { styled } from '../../styles/stitches.config';

/* Layout primitives shared across the public profile pages. */

export const Card = styled('div', {
  width: '100%',
  padding: '$md',
  marginTop: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
});

export const CardLabel = styled('div', {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '$darkgray',
  marginBottom: '$sm',
});

export const CardBody = styled('div', {
  fontSize: '$base',
  color: '$dark',
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  '& a': {
    color: '$heart',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  '& a:hover': {
    textDecoration: 'none',
  },
});

const StatRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$md',
});

const StatIcon = styled('div', {
  fontSize: '28px',
  lineHeight: 1,
});

const StatText = styled('div', {
  flex: 1,
});

const StatAmount = styled('div', {
  fontSize: '$xl',
  fontWeight: 700,
  color: '$dark',
  lineHeight: 1.1,
});

const StatCaption = styled('div', {
  fontSize: '14px',
  color: '$darkgray',
  marginTop: '4px',
});

export function StatCard({ icon = '💝', amount, caption }: { icon?: string; amount: string; caption: ReactNode }) {
  return (
    <Card>
      <StatRow>
        <StatIcon aria-hidden>{icon}</StatIcon>
        <StatText>
          <StatAmount>{amount}</StatAmount>
          <StatCaption>{caption}</StatCaption>
        </StatText>
      </StatRow>
    </Card>
  );
}

export function IntroCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card>
      <CardLabel>{label}</CardLabel>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

/**
 * Renders free-text content with any http(s) URLs converted into clickable
 * anchors. Falls back to plain text if no URLs are present.
 */
const URL_RE = /(https?:\/\/[^\s<>"'`)]+)/g;

export function linkify(text: string): ReactNode {
  if (!text) return null;
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      URL_RE.lastIndex = 0; // reset for next test
      // Strip a trailing period or comma that often follows a URL in prose.
      const trailing = /[.,;:!?]$/.test(part) ? part.slice(-1) : '';
      const cleanUrl = trailing ? part.slice(0, -1) : part;
      const display = cleanUrl.replace(/^https?:\/\//, '');
      return (
        <Fragment key={i}>
          <a href={cleanUrl} target="_blank" rel="noopener noreferrer">{display}</a>
          {trailing}
        </Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/* CTA primitives */

export const PrimaryCTA = styled('a', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$sm',
  width: '100%',
  padding: '14px 20px',
  marginTop: '$md',
  borderRadius: '$md',
  backgroundColor: '$heart',
  color: '$white',
  fontSize: '$md',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'background-color 0.15s ease, transform 0.05s ease',
  '&:hover': { backgroundColor: '#d63828' },
  '&:active': { transform: 'translateY(1px)' },
});

export const SecondaryLink = styled('a', {
  display: 'inline-block',
  marginTop: '$sm',
  color: '$darkgray',
  fontSize: '14px',
  textDecoration: 'none',
  '& strong': { color: '$dark' },
  '&:hover strong': { textDecoration: 'underline' },
});

export const SecondaryHint = styled('p', {
  textAlign: 'center',
  fontSize: '14px',
  color: '$darkgray',
  margin: '$md 0 0',
});

export const PageHeading = styled('h1', {
  fontSize: '$xxl',
  fontWeight: 700,
  textAlign: 'center',
  color: '$dark',
  margin: '$sm 0 4px',
  lineHeight: 1.2,
});

export const PageSubheading = styled('p', {
  textAlign: 'center',
  fontSize: '14px',
  color: '$darkgray',
  margin: '0 0 $md',
  letterSpacing: '0.02em',
});

export const SelfVisitBanner = styled('div', {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#fff8e1',
  border: '1px solid #ffe082',
  borderRadius: '$sm',
  marginBottom: '$md',
  textAlign: 'center',
  fontSize: '13px',
  color: '#665',
  '& a': { color: '#665', fontWeight: 600 },
});

/* Dashboard primitives */

const ShareCard = styled('div', {
  width: '100%',
  padding: '$md',
  marginTop: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
  textAlign: 'center',
});

const ShareHint = styled('p', {
  margin: '0 0 $sm',
  fontSize: '13px',
  color: '$darkgray',
});

const ShareUrlRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$sm',
  padding: '8px 12px',
  backgroundColor: '$white',
  border: '1px solid #e0e3e6',
  borderRadius: '$sm',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '13px',
  wordBreak: 'break-all',
  textAlign: 'left',
});

const ShareUrlText = styled('span', {
  flex: 1,
  color: '$dark',
});

const ShareCopyButton = styled('button', {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '$sm',
  color: '$darkgray',
  '&:hover': { color: '$heart' },
});

const CopiedFlash = styled('span', {
  fontSize: '12px',
  color: '#27ae60',
  fontWeight: 600,
});

export function ShareLinkCard({
  hint,
  url,
  copied,
  onCopy,
  copyIcon,
}: {
  hint: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
  copyIcon: ReactNode;
}) {
  return (
    <ShareCard>
      <ShareHint>{hint}</ShareHint>
      <ShareUrlRow>
        <ShareUrlText>{url}</ShareUrlText>
        <ShareCopyButton onClick={onCopy} aria-label="Copy link to clipboard">
          {copyIcon}
        </ShareCopyButton>
        {copied && <CopiedFlash>Copied!</CopiedFlash>}
      </ShareUrlRow>
    </ShareCard>
  );
}

const InfoLineRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 4px',
  borderBottom: '1px solid #f0f1f3',
  fontSize: '14px',
  '&:last-child': { borderBottom: 'none' },
});

const InfoLineLabel = styled('span', {
  color: '$darkgray',
  fontWeight: 500,
});

const InfoLineValue = styled('span', {
  color: '$dark',
  fontWeight: 500,
  textAlign: 'right',
});

export function InfoLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <InfoLineRow>
      <InfoLineLabel>{label}</InfoLineLabel>
      <InfoLineValue>{children}</InfoLineValue>
    </InfoLineRow>
  );
}

export const InfoLineGroup = styled('div', {
  width: '100%',
  marginTop: '$md',
});

/* Pitcher balance breakdown — three stats side-by-side with available emphasized. */

const BalanceRow = styled('div', {
  display: 'flex',
  width: '100%',
  marginTop: '$md',
  borderRadius: '$md',
  border: '1px solid #e8eaec',
  backgroundColor: '#fafbfc',
  overflow: 'hidden',
});

const BalanceCell = styled('div', {
  flex: 1,
  padding: '14px 8px',
  textAlign: 'center',
  borderRight: '1px solid #e8eaec',
  '&:last-child': { borderRight: 'none' },
  variants: {
    emphasis: {
      true: { backgroundColor: '#fff' },
    },
  },
});

const BalanceCellLabel = styled('div', {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '$darkgray',
  marginBottom: '4px',
});

const BalanceCellValue = styled('div', {
  fontSize: '$xl',
  fontWeight: 700,
  color: '$dark',
  lineHeight: 1.1,
  variants: {
    muted: {
      true: { color: '$darkgray' },
    },
  },
});

export function BalanceBreakdown({
  available,
  reserved,
  total,
}: {
  available: number;
  reserved: number;
  total: number;
}) {
  return (
    <BalanceRow>
      <BalanceCell emphasis>
        <BalanceCellLabel>Available</BalanceCellLabel>
        <BalanceCellValue>${available.toFixed(2)}</BalanceCellValue>
      </BalanceCell>
      <BalanceCell>
        <BalanceCellLabel>Reserved</BalanceCellLabel>
        <BalanceCellValue muted>${reserved.toFixed(2)}</BalanceCellValue>
      </BalanceCell>
      <BalanceCell>
        <BalanceCellLabel>Total</BalanceCellLabel>
        <BalanceCellValue muted>${total.toFixed(2)}</BalanceCellValue>
      </BalanceCell>
    </BalanceRow>
  );
}

/* Post-submit success card — shown after a successful book/request to
 * explain what happens next and where to track status. */

const SuccessHeading = styled('h2', {
  margin: '$md 0 4px',
  fontSize: '$xl',
  fontWeight: 700,
  color: '#1c7a3a',
  textAlign: 'center',
});

const SuccessBody = styled('p', {
  margin: '4px 0',
  fontSize: '$base',
  color: '$dark',
  lineHeight: 1.55,
  textAlign: 'center',
  '& strong': { color: '$dark' },
});

const SuccessTip = styled('p', {
  margin: '$md 0 0',
  fontSize: '13px',
  color: '$darkgray',
  textAlign: 'center',
});

const SuccessCardOuter = styled('div', {
  width: '100%',
  padding: '$md',
  marginTop: '$md',
  borderRadius: '$md',
  border: '2px solid #2ecc71',
  backgroundColor: '#e6f9e8',
});

const SuccessIcon = styled('div', {
  fontSize: '36px',
  textAlign: 'center',
  marginBottom: '$sm',
});

export function BookingSuccessCard({
  title,
  body,
  dashboardHref,
  dashboardLabel,
  tip,
}: {
  title: string;
  body: ReactNode;
  dashboardHref: string;
  dashboardLabel: string;
  tip?: ReactNode;
}) {
  return (
    <SuccessCardOuter role="status">
      <SuccessIcon aria-hidden>✓</SuccessIcon>
      <SuccessHeading>{title}</SuccessHeading>
      <SuccessBody>{body}</SuccessBody>
      <PrimaryCTA href={dashboardHref}>{dashboardLabel}</PrimaryCTA>
      {tip && <SuccessTip>{tip}</SuccessTip>}
    </SuccessCardOuter>
  );
}
