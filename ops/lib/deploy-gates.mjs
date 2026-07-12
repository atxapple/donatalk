// ops/lib/deploy-gates.mjs
//
// Pure deploy-gate logic for ops/deploy-web.mjs (Linux/Node port of
// ops/deploy-web.ps1). Kept side-effect-free so the Charter Sec 3b scanner,
// the Gate-4 heuristic, and the rollback-command selection are unit-testable
// without touching git, Vercel, or production.

// Charter Sec 3b gated surfaces — identical pattern to deploy-web.ps1,
// including PowerShell -match's case-insensitivity (the `i` flag).
// Over-matching is intentional: "when in doubt, treat as gated."
export const GATED_PATTERN =
  /(lib\/updateFunds|app\/api\/.*(order|checkout|complete-order)|credit_balance|reservedBalance|lib\/mailer|send-.*-email|send-notification|adminAuth|meetingTokens|admin-?allowlist|middleware|rate-?limit)/i;

// Merge the three git-diff file lists (committed vs origin, unstaged, staged)
// into a unique, sorted, empty-free list — mirrors the ps1's dedup.
export function dedupeChanged(...lists) {
  return [...new Set(lists.flat().filter(Boolean))].sort();
}

// Gate 3: which changed files touch a Sec 3b-gated surface (must ship via PR).
export function findGatedHits(changedFiles) {
  return changedFiles.filter((f) => GATED_PATTERN.test(f));
}

// Gate 4 heuristic: a shippable app change should bump package.json and update
// CHANGELOG.md. Returns true when the heuristic is satisfied (warn otherwise).
export function versionAndChangelogTouched(changedFiles) {
  const verChanged = changedFiles.includes('package.json');
  const logChanged = changedFiles.some((f) => /CHANGELOG\.md$/.test(f));
  return verChanged && logChanged;
}

// Extract the current production deployment URL (rollback target) from
// `vercel ls --prod` output. Returns null if none found.
export function parseProdDeployment(lsOutput) {
  const m = String(lsOutput ?? '').match(/https:\/\/\S+\.vercel\.app/);
  return m ? m[0] : null;
}

// Rollback command selection, shared by the live post-deploy path and the
// --self-test-rollback dry-run so the exact branch that fires under a real
// failure is what gets exercised. Returns argv (after `npx`).
export function rollbackArgs(prev) {
  return prev ? ['vercel', 'rollback', prev, '--yes'] : ['vercel', 'rollback', '--yes'];
}
