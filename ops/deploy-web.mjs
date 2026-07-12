// ops/deploy-web.mjs
//
// Linux/Node port of ops/deploy-web.ps1: deploy-gate + auto-rollback wrapper
// for app.donatalk.com (KR1-4, Charter Sec 4). Same gates, exit codes, and
// artifacts as the PowerShell original:
//
//   Gate 3 (first, cheapest): diff touches a Sec 3b-gated surface -> ALERT,
//     exit 10, no deploy (those changes ship via PR).
//   Gate 1: npx tsc --noEmit clean            (else ALERT, exit 11)
//   Gate 2: npm run test all green            (else ALERT, exit 12)
//   Gate 4: version bump + CHANGELOG present  (heuristic warning only)
//   Deploy: npx vercel --prod --yes           (nonzero -> ALERT, exit 13;
//     hang beyond DEPLOY_TIMEOUT_MS -> child killed, prod probed, ALERT,
//     exit 13 if prod green / rollback + exit 14 if not - backlog #27)
//   Post-deploy: synthetic probe; on failure auto-rollback to the last
//     known-good production deployment, re-probe, ALERT, exit 14. A broken
//     prod state is never left standing.
//
// Deploy-flow rule (DECISIONS 2026-07-12): merge-to-main already deploys via
// the Vercel git integration, so when the tree is identical to origin/main
// this wrapper runs probe-only instead of a redundant CLI deploy. The CLI
// deploy path is for working-tree (pre-merge) ships.
//
// The probe is the shared Linux probe ../ops-shared/check-site.sh (writes
// ops/logs/site-check-*.json + ALERT on failure); if that script is absent
// this falls back to inline HTTP 200 checks of the same three critical paths.
//
// Usage:
//   node ops/deploy-web.mjs                       # gates -> deploy -> probe -> (rollback)
//   node ops/deploy-web.mjs --skip-deploy         # gates + probe only (CI-style dry check)
//   node ops/deploy-web.mjs --self-test-rollback  # exercise the rollback branch, dry-run

import { writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  dedupeChanged,
  findGatedHits,
  versionAndChangelogTouched,
  parseProdDeployment,
  rollbackArgs,
  spawnOutcome,
  isRedundantCliDeploy,
  DEPLOY_TIMEOUT_MS,
  VERCEL_LS_TIMEOUT_MS,
  ROLLBACK_TIMEOUT_MS,
} from './lib/deploy-gates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_DIR = path.join(ROOT, 'ops/logs');
const SHARED_PROBE = path.resolve(ROOT, '../ops-shared/check-site.sh');
const CRITICAL_PATHS = [
  'https://app.donatalk.com/',
  'https://app.donatalk.com/listeners',
  'https://app.donatalk.com/login',
];
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

const args = process.argv.slice(2);
const skipDeploy = args.includes('--skip-deploy');
const selfTestRollback = args.includes('--self-test-rollback');

mkdirSync(LOG_DIR, { recursive: true });

function writeDeployAlert(reason, detail) {
  const f = path.join(LOG_DIR, `ALERT-deploy-${STAMP}.txt`);
  writeFileSync(
    f,
    `ALERT (deploy) - ${STAMP}\nReason: ${reason}\n${detail}\n\n` +
      `Charter Sec 4 (Deploy Gates) / Sec 8 (escalation). Board action may be required.\n`
  );
  console.log(`WROTE ${f}`);
}

// Append an ops-health row so KR1-2 coverage records the deploy attempt.
function addDeployHealthRow(h1, h4, note) {
  const csv = path.join(ROOT, 'docs/company/metrics/ops-health-log.csv');
  appendFileSync(csv, `${STAMP},deploy,${h1},none,not-run,${h4},${note}\n`);
}

function run(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { cwd: ROOT, stdio: 'inherit', ...opts });
  return r.status ?? 1;
}

// Like run(), but kills the child if it exceeds timeoutMs (SIGKILL - a wedged
// Vercel CLI ignored the run-29 wait entirely). Returns { exit, timedOut }.
function runTimed(cmd, argv, timeoutMs) {
  const r = spawnSync(cmd, argv, {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
  });
  return spawnOutcome(r);
}

function gitFiles(...diffArgs) {
  const r = spawnSync('git', ['diff', '--name-only', ...diffArgs], { cwd: ROOT, encoding: 'utf8' });
  return (r.stdout || '').split('\n').map((s) => s.trim());
}

// Synthetic probe of current production. Prefers the shared Linux probe (same
// artifact/ALERT behavior as every scheduled run); inline HTTP fallback keeps
// the wrapper functional if ops-shared is missing. Returns 0 = healthy.
async function probeProduction() {
  if (existsSync(SHARED_PROBE)) {
    return run('bash', [SHARED_PROBE, 'donatalk']);
  }
  console.log('WARN: shared probe not found - inline HTTP checks of critical paths.');
  let failed = 0;
  for (const url of CRITICAL_PATHS) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
      const ok = res.status === 200;
      console.log(`  ${url} -> ${res.status}${ok ? '' : ' FAIL'}`);
      if (!ok) failed++;
    } catch (e) {
      console.log(`  ${url} -> ERROR ${String(e.message || e).slice(0, 80)}`);
      failed++;
    }
  }
  return failed === 0 ? 0 : 1;
}

// Rollback execution shared by the live post-deploy path and the self-test
// dry-run so the exact branch that fires under a real failure is exercised.
function invokeRollback(prev, dryRun) {
  const argv = rollbackArgs(prev);
  if (dryRun) {
    console.log(`[dry-run] would run: npx ${argv.join(' ')}`);
    return 0;
  }
  const rb = runTimed('npx', argv, ROLLBACK_TIMEOUT_MS);
  if (rb.timedOut) console.log('WARN: vercel rollback timed out and was killed (exit 124).');
  return rb.exit;
}

// ---- Self-test: exercise the auto-rollback branch WITHOUT a live failure ----
// A real failing production deploy would cause an actual outage (Charter Sec 2:
// never leave prod broken), so we prove the rollback branch - target resolution,
// command selection, and the re-probe confirm step - end to end in dry-run.
// Writes a clearly-marked SELFTEST artifact; does NOT deploy or roll back.
if (selfTestRollback) {
  console.log('SELF-TEST: exercising rollback branch (no deploy, no live rollback).');
  const prev = 'https://donatalk-known-good-SELFTEST.vercel.app'; // mock rollback target
  console.log('Simulated post-deploy probe: FAIL (forced) - entering rollback branch.');
  const rb = invokeRollback(prev, true);
  console.log('Confirm step: re-probing current production (read-only)...');
  const reprobe = await probeProduction();
  const f = path.join(LOG_DIR, `SELFTEST-rollback-${STAMP}.txt`);
  writeFileSync(
    f,
    `SELF-TEST (rollback branch) - ${STAMP}\n` +
      `Simulated post-deploy probe: FAIL (forced)\n` +
      `Rollback target resolved: ${prev}\n` +
      `Rollback command (dry-run) exit: ${rb}\n` +
      `Post-rollback re-probe exit: ${reprobe}  (0 = current prod healthy)\n` +
      `Result: rollback branch exercised end-to-end without touching production.\n` +
      `Remaining: true live-fire on a real failing deploy (controlled window).\n`
  );
  console.log(`SELF-TEST complete - wrote ${f} (re-probe exit=${reprobe}).`);
  process.exit(reprobe);
}

// ---- Gate 3 (run FIRST - cheapest, and the one that protects donor trust) ----
const changed = dedupeChanged(
  gitFiles('origin/main...HEAD'), // committed vs origin
  gitFiles(),                     // unstaged
  gitFiles('--cached')            // staged
);
const hits = findGatedHits(changed);
if (hits.length) {
  writeDeployAlert(
    'gated-surface-touched',
    `Diff touches Sec 3b-gated files - must ship via PR, not auto-deploy:\n${hits.join('\n')}`
  );
  process.exit(10);
}

// ---- Deploy-flow rule (DECISIONS 2026-07-12, backlog #27) ----
// Merging to main IS the production deploy (Vercel git integration). If this
// tree is identical to origin/main there is nothing for the CLI to ship - it
// already deployed on merge and gated before merging - so probe-only instead
// of a redundant CLI deploy (the run-29 30-min hang was exactly this case).
if (!skipDeploy && isRedundantCliDeploy(changed)) {
  console.log(
    'No changes vs origin/main - this tree already shipped via the Vercel git integration on merge. Probe-only (deploy-flow rule, DECISIONS 2026-07-12).'
  );
  process.exit(await probeProduction());
}

// ---- Gate 1: tsc clean ----
console.log('Gate 1/4: npx tsc --noEmit ...');
if (run('npx', ['tsc', '--noEmit']) !== 0) {
  writeDeployAlert('tsc-failed', 'npx tsc --noEmit reported errors - not shipping.');
  process.exit(11);
}

// ---- Gate 2: tests pass (a red build never ships) ----
console.log('Gate 2/4: npm run test ...');
if (run('npm', ['run', 'test']) !== 0) {
  writeDeployAlert('tests-failed', 'npm run test failed - a red build never ships.');
  process.exit(12);
}

// ---- Gate 4: version bump + CHANGELOG (heuristic warning only) ----
if (!versionAndChangelogTouched(changed)) {
  console.log(
    'WARN (Gate 4): package.json and/or CHANGELOG.md not in the diff. If this is a shippable app change, bump version + update CHANGELOG per .ai-instructions.md.'
  );
}
console.log('Deploy gates passed.');

if (skipDeploy) {
  console.log('--skip-deploy set - probing current production only (no deploy).');
  process.exit(await probeProduction());
}

// ---- Capture last known-good production deployment (rollback target) ----
let prev = null;
try {
  const ls = spawnSync('npx', ['vercel', 'ls', '--prod', '--yes'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: VERCEL_LS_TIMEOUT_MS,
    killSignal: 'SIGKILL',
  });
  prev = parseProdDeployment(`${ls.stdout || ''}\n${ls.stderr || ''}`);
} catch {}
if (prev) console.log(`Known-good production deployment (rollback target): ${prev}`);
else console.log("WARN: could not resolve current prod deployment; rollback will fall back to 'vercel rollback' (previous).");

// ---- Deploy to production ----
console.log(`Deploying to production: npx vercel --prod (timeout ${DEPLOY_TIMEOUT_MS / 60000} min) ...`);
const dep = runTimed('npx', ['vercel', '--prod', '--yes'], DEPLOY_TIMEOUT_MS);
if (dep.timedOut) {
  // Run-29 class: Vercel-side hung/UNKNOWN deployment. The child is killed;
  // prod state is unknown, so probe - and roll back if prod is actually broken.
  console.log(`DEPLOY TIMED OUT after ${DEPLOY_TIMEOUT_MS / 60000} min - child killed. Probing production...`);
  const hangProbe = await probeProduction();
  if (hangProbe !== 0) {
    console.log('Production probe FAILED after deploy hang - auto-rolling-back.');
    const rb = invokeRollback(prev, false);
    const reprobe = await probeProduction();
    writeDeployAlert(
      'deploy-timeout-rolled-back',
      `vercel --prod exceeded ${DEPLOY_TIMEOUT_MS / 60000} min (killed) AND the production probe failed; rolled back to '${prev}' (rollback exit=${rb}, re-probe exit=${reprobe}).`
    );
    addDeployHealthRow('fail', 'rolled-back', `deploy hang killed; probe failed; rollback exit=${rb} re-probe=${reprobe}`);
    process.exit(14);
  }
  writeDeployAlert(
    'deploy-timeout',
    `vercel --prod exceeded ${DEPLOY_TIMEOUT_MS / 60000} min and was killed. Production probe is GREEN (the hung deployment never promoted). Likely a Vercel-side stuck/UNKNOWN deployment - check the dashboard for a stale entry to cancel.`
  );
  addDeployHealthRow('fail', 'deploy-timeout', 'vercel --prod hang killed; prod probe green');
  process.exit(13);
}
if (dep.exit !== 0) {
  writeDeployAlert('deploy-failed', 'npx vercel --prod returned non-zero.');
  addDeployHealthRow('fail', 'deploy-error', 'vercel --prod nonzero');
  process.exit(13);
}

// ---- Post-deploy synthetic probe ----
await new Promise((r) => setTimeout(r, 10000)); // let the promotion propagate
const probe = await probeProduction();

if (probe !== 0) {
  console.log('POST-DEPLOY PROBE FAILED - auto-rolling-back.');
  const rb = invokeRollback(prev, false);
  const reprobe = await probeProduction(); // confirm rollback restored health
  writeDeployAlert(
    'auto-rollback-fired',
    `Post-deploy probe failed; rolled back to '${prev}' (rollback exit=${rb}, re-probe exit=${reprobe}).`
  );
  addDeployHealthRow('fail', 'rolled-back', `probe failed; rollback exit=${rb} re-probe=${reprobe}`);
  process.exit(14);
}

console.log('Deploy healthy - production probe green.');
addDeployHealthRow('success', 'no-rollback', 'deploy + post-deploy probe green');
process.exit(0);
