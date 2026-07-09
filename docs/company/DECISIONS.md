# DonaTalk — Decision Log

Important, durable decisions only — the ones that shape how the business runs.
Operational narrative → `reports/`. Machine logs/alerts → `ops/logs/`.
Format: `date — decision — one-line rationale`. Newest first.

## 2026-07-09
- Ops scripts are pure-ASCII (no `§`/`—`), not UTF-8-with-typography. — Windows PowerShell 5.1 (the scheduler host shell) reads BOM-less `.ps1` as ANSI and mis-decodes non-ASCII; it had silently broken `deploy-web.ps1` parsing. ASCII is portable across PS 5.1/7 with no BOM dependency.

## 2026-07-08
- Board-review docs stay concise; DECISIONS holds only important decisions. — fast board review.
- Autonomy: full auto-deploy (gated: tests+tsc pass, money/auth/email excluded, auto-rollback), both SEO surfaces, fully autonomous posting (supervised ramp + kill-switch). — board's velocity call; rails protect solvency and brand.
- Adopted the company-OS model (Charter→OKR→Strategy→Backlog→Decisions→Metrics), money-hardened vs TierUp. — the repo is the memory for unattended runs.
