# DonaTalk — Autonomous Operations (`ops/`)

The machinery that lets this repo be operated unattended by scheduled Claude
agents. Pattern: **Windows Task Scheduler → `run-routine.ps1` → `claude -p <prompt>`**.
Each run has zero memory; `docs/company/` is the memory.

## Layout
```
ops/
├── run-routine.ps1      # generic runner: invokes claude -p, pre-flight, failure classify, alert
├── check-site.ps1       # 6-hourly synthetic probe of app.donatalk.com critical paths
├── get-metrics.ps1      # collect + append rows to docs/company/metrics/*.csv
├── routines/
│   ├── daily-ops.md     # every 3h — read OS, health, advance backlog, write brief
│   ├── growth-research.md  # daily — SEO/competitor/demand research
│   └── weekly-report.md    # Mon — board report
└── logs/                # run logs, probe JSON, ALERT-*.txt (gitignored except .gitkeep)
```

## Scheduled jobs (to register on the always-on host — BLOCKED on board §6)
| Job | Cadence (America/Chicago) | Command |
|-----|---------------------------|---------|
| Daily ops | every 3h from 06:00 | `run-routine.ps1 -Routine daily-ops` |
| Growth research | daily 05:00 | `run-routine.ps1 -Routine growth-research` |
| Weekly report | Mon 08:00 | `run-routine.ps1 -Routine weekly-report` |
| Health probe | every 6h | `check-site.ps1` |

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
