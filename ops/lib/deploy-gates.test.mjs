import { describe, it, expect } from 'vitest';
import {
  GATED_PATTERN,
  dedupeChanged,
  findGatedHits,
  versionAndChangelogTouched,
  parseProdDeployment,
  rollbackArgs,
} from './deploy-gates.mjs';

describe('GATED_PATTERN / findGatedHits (Charter Sec 3b scanner)', () => {
  const gated = [
    'lib/updateFunds.ts',
    'lib/updateFundsHelper.ts',
    'app/api/paypal/order/route.ts',
    'app/api/paypal/checkout/route.ts',
    'app/api/meetings/complete-order/route.ts',
    'lib/credit_balance.ts',
    'types/reservedBalance.d.ts',
    'lib/mailer.ts',
    'app/api/send-welcome-email/route.ts',
    'app/api/send-notification/route.ts',
    'lib/adminAuth.ts',
    'lib/meetingTokens.ts',
    'config/admin-allowlist.json',
    'config/adminAllowlist.json',
    'middleware.ts',
    'lib/rate-limit.ts',
    'lib/ratelimit.ts',
  ];
  it.each(gated)('flags %s as gated', (f) => {
    expect(GATED_PATTERN.test(f)).toBe(true);
  });

  const safe = [
    'app/vs/page.tsx',
    'components/FurtherReading.tsx',
    'ops/get-metrics.mjs',
    'docs/company/BACKLOG.md',
    'app/sitemap.ts',
    'package.json',
  ];
  it.each(safe)('does not flag %s', (f) => {
    expect(GATED_PATTERN.test(f)).toBe(false);
  });

  it('returns only the gated subset', () => {
    expect(findGatedHits(['app/vs/page.tsx', 'lib/mailer.ts', 'README.md'])).toEqual([
      'lib/mailer.ts',
    ]);
  });

  it('returns empty for a clean diff', () => {
    expect(findGatedHits(['docs/company/OKR.md', 'ops/deploy-web.mjs'])).toEqual([]);
  });
});

describe('dedupeChanged', () => {
  it('merges, dedupes, sorts, and drops empties across the three diff lists', () => {
    expect(
      dedupeChanged(['b.ts', 'a.ts', ''], ['a.ts'], ['c.ts', null, undefined])
    ).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });
  it('handles all-empty input', () => {
    expect(dedupeChanged([], [], [])).toEqual([]);
  });
});

describe('versionAndChangelogTouched (Gate 4 heuristic)', () => {
  it('true when both package.json and CHANGELOG.md changed', () => {
    expect(versionAndChangelogTouched(['package.json', 'CHANGELOG.md', 'app/x.tsx'])).toBe(true);
  });
  it('false when only package.json changed', () => {
    expect(versionAndChangelogTouched(['package.json'])).toBe(false);
  });
  it('false when only CHANGELOG.md changed', () => {
    expect(versionAndChangelogTouched(['CHANGELOG.md'])).toBe(false);
  });
  it('does not match nested package.json paths as the root bump', () => {
    expect(versionAndChangelogTouched(['sub/package.json', 'CHANGELOG.md'])).toBe(false);
  });
});

describe('parseProdDeployment', () => {
  it('extracts the first vercel.app URL from vercel ls output', () => {
    const out = [
      'Vercel CLI 39.0.0',
      '  Age  Deployment                                        Status',
      '  2d   https://donatalk-abc123-atxapple.vercel.app        Ready',
      '  5d   https://donatalk-def456-atxapple.vercel.app        Ready',
    ].join('\n');
    expect(parseProdDeployment(out)).toBe('https://donatalk-abc123-atxapple.vercel.app');
  });
  it('returns null when no deployment URL is present', () => {
    expect(parseProdDeployment('Error! No deployments found')).toBeNull();
    expect(parseProdDeployment('')).toBeNull();
    expect(parseProdDeployment(null)).toBeNull();
  });
});

describe('rollbackArgs', () => {
  it('targets the known-good deployment when resolved', () => {
    expect(rollbackArgs('https://donatalk-abc.vercel.app')).toEqual([
      'vercel',
      'rollback',
      'https://donatalk-abc.vercel.app',
      '--yes',
    ]);
  });
  it('falls back to previous-deployment rollback when unresolved', () => {
    expect(rollbackArgs(null)).toEqual(['vercel', 'rollback', '--yes']);
  });
});
