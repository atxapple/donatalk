# DonaTalk — Decision Log

Important, durable decisions only — the ones that shape how the business runs.
Operational narrative → `reports/`. Machine logs/alerts → `ops/logs/`.
Format: `date — decision — one-line rationale`. Newest first.

## 2026-07-11
- Funnel metric definitions pinned in code (`ops/lib/funnel-metrics.mjs`, unit-tested): F1 = distinct uids with a profile doc created in 7d; F2 = pitchers with `credit_balance > 0` (all-time); F3 = meetings created in 7d; F4 = meetings `accepted` with `respondedAt` in 7d; R1 = 30d meetings / distinct booking pitchers. — first real funnel rows land 2026-07-11 (run 26); every future row must mean the same thing, so the definitions live in tested code, not run notes.
- Ops host migrated Windows → always-on Linux (board disabled the old Task Scheduler jobs). Cron + shared runner `../ops-shared/run-routine.sh` (git hard-reset pre-flight — **push before finishing or work is lost**); host note appended to every routine prompt; PowerShell `.ps1` surfaces need bash/node ports (Node scripts work as-is). — board-directed migration; also resolves the old "always-on scheduler host" blocker (backlog item 6) and the run-19 shared-working-dir hazard (dedicated repo copy on this host).
- Full production env is now local (`.env.local`, pulled from Vercel) — **Firebase Admin verified working (52 auth users)**, so funnel metrics F1–F4 are finally measurable; GSC key in place (`gsc-sa.json`, pull verified). — removes the standing "funnel n/a" gap in every metrics row.
- BOARD RULING: portfolio attention 50/50 with TierUp (one operator, two businesses, shared ops layer + learnings); posting accounts approved for **Reddit, LinkedIn, X** — board creates accounts and lands credentials in `ops-shared/.env-social` (never chat, per the 07-10 secret-handling lesson), agent posts truthfully within charter §6. — resolves backlog item 15, the sole remaining unlock for KR2-3 (external backlinks).

## 2026-07-10
- Reframing an **unpublished** SEO draft to match our own sourced benchmarks is CEO-autonomous content work (§3a + §6), not a board-gated "positioning call." — Runs 12–13 twice deferred the #16 cold-email hook reframe to the board; on review it isn't a §3b surface, needs no credential (like the #17 draft edit run 12 already did autonomously), is fully reversible, and the board still reviews via PR before WP publish. The old flat "~1% average" claim was *contradicted* by our sourced ~3.4% platform average — leaving it would violate §6 (truthful only). Convention going forward: cold-email framing in DonaTalk content uses the sourced collapsing-average (~5.1%→~3.4%), with **1–3% reserved explicitly as the warm-vs-cold comparison range**, never as "the average." Future runs: don't re-defer sourced-truthfulness edits to unpublished drafts.
- The canonical unit-test count is **299** (24 files), not 598. — vitest's anchored `e2e/**`/`node_modules/**` excludes missed the nested `.claude/worktrees/company-os-scaffold/` copy, so it double-counted every unit test (299×2) and added 7 failing Playwright specs. Exclude broadened to `**/`-prefixed globs incl. `**/.claude/**`; the "598" in earlier run notes was inflated. Charter §4's "~299" is the correct deploy-gate baseline. (Test-tooling fix only — no product code, no version bump, consistent with how ops/infra changes are tracked.)

## 2026-07-09
- Validate the deploy auto-rollback via a dry-run self-test (`-SelfTestRollback`), not a real failing prod deploy. — A live rollback test means deliberately breaking production (Charter §2: never leave prod broken); the self-test proves the branch's logic (target/command/re-probe) without an outage. True live-fire is reserved for a controlled, human-in-loop window.
- Ops scripts are pure-ASCII (no `§`/`—`), not UTF-8-with-typography. — Windows PowerShell 5.1 (the scheduler host shell) reads BOM-less `.ps1` as ANSI and mis-decodes non-ASCII; it had silently broken `deploy-web.ps1` parsing. ASCII is portable across PS 5.1/7 with no BOM dependency.

## 2026-07-08
- Board-review docs stay concise; DECISIONS holds only important decisions. — fast board review.
- Autonomy: full auto-deploy (gated: tests+tsc pass, money/auth/email excluded, auto-rollback), both SEO surfaces, fully autonomous posting (supervised ramp + kill-switch). — board's velocity call; rails protect solvency and brand.
- Adopted the company-OS model (Charter→OKR→Strategy→Backlog→Decisions→Metrics), money-hardened vs TierUp. — the repo is the memory for unattended runs.
