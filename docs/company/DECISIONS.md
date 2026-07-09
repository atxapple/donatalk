# DonaTalk — Decision Log

> Append-only record of consequential decisions. Newest first.

## 2026-07-08 — Company OS established
- Ported the TierUp.AI autonomous-company scaffolding into DonaTalk, adapted for
  a **live money-handling** product (stricter escalation gates than TierUp).
- Created `docs/company/` (Charter, OKR, Strategy, Backlog, Decisions, Metrics)
  and `ops/` (runner, routines, health probe, metrics collector).
- **Owner:** CEO (Claude), on Board instruction. **Status:** pending Charter
  sign-off.

## 2026-07-08 — Board autonomy decisions (Cycle 1)
- **Full auto-deploy** approved for the live app. CEO mandated Deploy Gates
  (`CHARTER.md` §4): green tests + tsc, money/auth surfaces excluded, post-deploy
  probe with auto-rollback. Dissent recorded: CEO recommended PR-only for a money
  app; Board chose full auto-deploy; proceeding with safety rails.
- **Both SEO surfaces** approved — app + WordPress. Requires a WP credential.
- **Fully autonomous posting** approved. CEO mandated a supervised ramp (first 5
  posts reviewed) + per-platform ToS/rate limits + reputation kill-switch
  (`CHARTER.md` §7). Dissent recorded: CEO recommended draft-then-approve;
  Board chose full autonomy; proceeding with guardrails.

## 2026-07-08 — Git history: wrong contributor removed
- A prior parallel task cleaned the git history to remove an incorrect
  contributor. Confirmed the working tree is clean and `main` matches origin.
  Canonical author going forward: `atxapple <atxapplellc@gmail.com>` with
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Future history rewrites remain a §3b-gated (escalate) action.
