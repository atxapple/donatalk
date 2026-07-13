import { describe, it, expect } from 'vitest';
import { CHECKS, evaluateCheck, buildArtifact, utcStamp } from './site-probe.mjs';

describe('CHECKS (parity with check-site.ps1 marker spec)', () => {
  it('covers the three critical paths with the original markers', () => {
    expect(CHECKS).toEqual([
      { path: '/', marker: 'DonaTalk' },
      { path: '/listeners', marker: 'listener' },
      { path: '/login', marker: 'DonaTalk' },
    ]);
  });
});

describe('evaluateCheck', () => {
  it('passes on 200 + marker present', () => {
    expect(evaluateCheck(200, '<html>Welcome to DonaTalk</html>', 'DonaTalk')).toEqual({
      statusOk: true,
      markerOk: true,
      ok: true,
    });
  });

  it('is case-insensitive like PowerShell -match', () => {
    expect(evaluateCheck(200, 'browse LISTENERS here', 'listener').ok).toBe(true);
    expect(evaluateCheck(200, 'donatalk footer', 'DonaTalk').ok).toBe(true);
  });

  it('fails on 200 with marker missing (the case the HTTP-only probe missed)', () => {
    const r = evaluateCheck(200, '<html>Application error</html>', 'DonaTalk');
    expect(r.statusOk).toBe(true);
    expect(r.markerOk).toBe(false);
    expect(r.ok).toBe(false);
  });

  it('fails on non-200 regardless of body', () => {
    expect(evaluateCheck(500, 'DonaTalk', 'DonaTalk').ok).toBe(false);
    expect(evaluateCheck(301, 'DonaTalk', 'DonaTalk').ok).toBe(false);
  });

  it('fails on fetch error (status ERR, empty body)', () => {
    expect(evaluateCheck('ERR', '', 'DonaTalk').ok).toBe(false);
  });
});

describe('buildArtifact (shape consumed by get-metrics.mjs / deploy-web.mjs)', () => {
  const okResult = { url: 'https://app.donatalk.com/', status: 200, ok: true, marker: 'DonaTalk', marker_ok: true };
  const badResult = { url: 'https://app.donatalk.com/login', status: 200, ok: false, marker: 'DonaTalk', marker_ok: false };

  it('reports pass with zero failures', () => {
    const a = buildArtifact('20260713T000000Z', 'https://app.donatalk.com', [okResult]);
    expect(a.overall).toBe('pass');
    expect(a.failed).toBe(0);
    expect(a.timestamp).toBe('20260713T000000Z'); // get-metrics.mjs staleness check reads this
    expect(a.business).toBe('donatalk');
    expect(a.full_probe).toBe('skipped');
  });

  it('reports fail and counts failed checks', () => {
    const a = buildArtifact('20260713T000000Z', 'https://app.donatalk.com', [okResult, badResult]);
    expect(a.overall).toBe('fail');
    expect(a.failed).toBe(1);
  });
});

describe('utcStamp', () => {
  it('formats like the shared probe (yyyyMMddTHHmmssZ)', () => {
    expect(utcStamp(new Date('2026-07-13T00:30:01.123Z'))).toBe('20260713T003001Z');
  });
});
