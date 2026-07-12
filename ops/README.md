# DonaTalk — Autonomous Operations (`ops/`)

The machinery that lets this repo be operated unattended by scheduled Claude
agents. Pattern (since the 2026-07-11 Linux migration): **cron →
`../ops-shared/run-routine.sh` → `claude -p <prompt>`**. Each run has zero
memory; `docs/company/` is the memory.

> **Host note (2026-07-11):** ops moved from Windows to an always-on Linux host.
> PowerShell is NOT available — the `.ps1` scripts below are legacy until ported.
> Node `.mjs` scripts run unchanged. Ported so far: `get-metrics.ps1` →
> `get-metrics.mjs`, `deploy-web.ps1` → `deploy-web.mjs` (deploys unblocked
> 2026-07-12). Still to port: full-marker site probe (item 21; the shared
> `ops-shared/check-site.sh` does HTTP-200 checks + writes the probe JSON).

## Layout
```
ops/
├── get-metrics.mjs      # ACTIVE: collect + append rows to docs/company/metrics/*.csv
│                        #   F1-F4/R1 via Firebase Admin (read-only), A4-A6 via gsc-pull,
│                        #   A7 from ledger, ops-health row from newest site-check JSON
├── lib/funnel-metrics.mjs  # pure funnel computation + metric definitions (tested)
├── deploy-web.mjs       # ACTIVE: gated deploy + auto-rollback (Linux port of deploy-web.ps1)
├── lib/deploy-gates.mjs # pure gate logic: Sec 3b scanner, Gate-4 heuristic, rollback cmd (tested)
├── publish-wp.mjs       # publish a content draft -> WordPress REST (env creds, draft by default)
├── lib/md-to-wp.mjs     # pure markdown+frontmatter -> WP payload converter (tested)
├── gsc-pull.mjs         # pull GSC metrics via service-account (read-only); --log appends to awareness CSV
├── run-routine.ps1      # LEGACY (Windows) — superseded by ../ops-shared/run-routine.sh
├── check-site.ps1       # LEGACY (Windows) — superseded by ../ops-shared/check-site.sh (markers pending port)
├── deploy-web.ps1       # LEGACY (Windows) — superseded by deploy-web.mjs
├── get-metrics.ps1      # LEGACY (Windows) — superseded by get-metrics.mjs
├── routines/
│   ├── daily-ops.md     # every 3h — read OS, health, advance backlog, write brief
│   ├── growth-research.md  # daily — SEO/competitor/demand research
│   └── weekly-report.md    # Mon — board report
└── logs/                # run logs, probe JSON, ALERT-*.txt (gitignored except .gitkeep)
```

## Metrics collection (`get-metrics.mjs`)
```
node ops/get-metrics.mjs             # collect + append awareness/funnel/ops-health rows
node ops/get-metrics.mjs --dry-run   # print rows, append nothing
```
Reads `.env.local` (never committed). Firestore access is **read-only counts**
(`select()` projections; no doc contents printed, no writes). Any source failure
degrades that field to `n/a - <reason>` — a row is always appended (KR1-2).

## Scheduled jobs (to register on the always-on host — BLOCKED on board §6)
| Job | Cadence (America/Chicago) | Command |
|-----|---------------------------|---------|
| Daily ops | every 3h from 06:00 | `run-routine.ps1 -Routine daily-ops` |
| Growth research | daily 05:00 | `run-routine.ps1 -Routine growth-research` |
| Weekly report | Mon 08:00 | `run-routine.ps1 -Routine weekly-report` |
| Health probe | every 6h | `check-site.ps1` |
| Gated deploy | on shippable change | `deploy-web.ps1` (gates → deploy → probe → auto-rollback) |

## Gated deploy + auto-rollback (`deploy-web.mjs`)
```
node ops/deploy-web.mjs                       # gates -> vercel --prod -> probe -> (auto-rollback)
node ops/deploy-web.mjs --skip-deploy         # gates + probe only, no deploy (CI-style check)
node ops/deploy-web.mjs --self-test-rollback  # exercise the rollback branch in dry-run
```
Same gates and exit codes as the ps1 original: Sec 3b scan (10) → tsc (11) →
tests (12) → Gate-4 warning → deploy (13) → probe → rollback+ALERT (14). Probe
is `../ops-shared/check-site.sh donatalk` (inline HTTP fallback). Pure gate
logic in `lib/deploy-gates.mjs` (unit-tested). Verified 2026-07-12: rollback
self-test green + live Sec 3b gate-trip (exit 10, ALERT, no deploy).

## WordPress publishing (`publish-wp.mjs`)
Turns a `docs/company/content/*.md` draft (YAML frontmatter + Markdown) into a
WordPress REST post. **Credentials come only from env** (`WORDPRESS_API_URL`,
`WORDPRESS_APP_USER`, `WORDPRESS_APP_PASSWORD`) — never hardcoded (Charter §6).
**Draft by default**; live publishing needs an explicit `--publish`. `--dry-run`
(or missing creds) prints the resolved endpoint + HTML and makes no network call.
```
node ops/publish-wp.mjs docs/company/content/<draft>.md --dry-run   # offline preview
node ops/publish-wp.mjs docs/company/content/<draft>.md             # create WP draft
node ops/publish-wp.mjs docs/company/content/<draft>.md --publish   # go live (guarded)
```
**Not yet run live** — the board must first rotate the WP App Password (it transited
chat). The markdown→HTML converter (`lib/md-to-wp.mjs`) is unit-tested
(`lib/md-to-wp.test.mjs`) and dry-run-verified against the current drafts.

## Search Console metrics (`gsc-pull.mjs`)
Pulls the donatalk.com GSC Performance data (clicks / impressions / CTR / position +
branded-vs-non-branded query split) via a **read-only service account** — no browser,
so it works unattended. Key path comes from `.env.local` (`GSC_SA_KEY_FILE`, gitignored);
the SA must be added as a Restricted user on the GSC property.
```
node ops/gsc-pull.mjs                # 28d summary to stdout
node ops/gsc-pull.mjs --days 90 --json
node ops/gsc-pull.mjs --log          # append a real row to metrics/awareness-log.csv (A4/A5/A6)
```
Dependency-free (signs the OAuth JWT with node `crypto`). Never commit the key.

## Guardrails
The runner runs `claude -p` with `--permission-mode acceptEdits`. Escalation
gates (money/auth/email/secrets/destructive) are enforced by the **Charter the
agent reads**, not by the shell — the agent opens a PR + writes an `ALERT-*`
instead of self-merging when a gate is hit. See `docs/company/CHARTER.md`.

## Failure alerting
`run-routine.ps1` classifies non-zero exits (credit exhaustion, workspace-trust,
permission error, git-write failure, unknown) and writes
`logs/ALERT-<class>-<timestamp>.txt`. Board watches for `ALERT-*`.

## Status
Scaffolded 2026-07-08. Scripts are runnable but **jobs are not yet registered**
(needs an always-on scheduler host — board action). Health/metrics collection is
partially stubbed where it needs credentials (GSC, Firestore admin, Cloudflare).
