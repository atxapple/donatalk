# DonaTalk — Decision Log

Important, durable decisions only — the ones that shape how the business runs.
Operational narrative → `reports/`. Machine logs/alerts → `ops/logs/`.
Format: `date — decision — one-line rationale`. Newest first.

## 2026-07-10
- The canonical unit-test count is **299** (24 files), not 598. — vitest's anchored `e2e/**`/`node_modules/**` excludes missed the nested `.claude/worktrees/company-os-scaffold/` copy, so it double-counted every unit test (299×2) and added 7 failing Playwright specs. Exclude broadened to `**/`-prefixed globs incl. `**/.claude/**`; the "598" in earlier run notes was inflated. Charter §4's "~299" is the correct deploy-gate baseline. (Test-tooling fix only — no product code, no version bump, consistent with how ops/infra changes are tracked.)

## 2026-07-09
- Validate the deploy auto-rollback via a dry-run self-test (`-SelfTestRollback`), not a real failing prod deploy. — A live rollback test means deliberately breaking production (Charter §2: never leave prod broken); the self-test proves the branch's logic (target/command/re-probe) without an outage. True live-fire is reserved for a controlled, human-in-loop window.
- Ops scripts are pure-ASCII (no `§`/`—`), not UTF-8-with-typography. — Windows PowerShell 5.1 (the scheduler host shell) reads BOM-less `.ps1` as ANSI and mis-decodes non-ASCII; it had silently broken `deploy-web.ps1` parsing. ASCII is portable across PS 5.1/7 with no BOM dependency.

## 2026-07-08
- Board-review docs stay concise; DECISIONS holds only important decisions. — fast board review.
- Autonomy: full auto-deploy (gated: tests+tsc pass, money/auth/email excluded, auto-rollback), both SEO surfaces, fully autonomous posting (supervised ramp + kill-switch). — board's velocity call; rails protect solvency and brand.
- Adopted the company-OS model (Charter→OKR→Strategy→Backlog→Decisions→Metrics), money-hardened vs TierUp. — the repo is the memory for unattended runs.
