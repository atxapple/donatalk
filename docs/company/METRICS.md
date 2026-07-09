# DonaTalk — Metrics Catalog

> The definition of every number we track and where it's logged.
> Every scheduled run appends to the logs below (KR1-2 = 100% coverage).
> Last updated: 2026-07-08

## Why these metrics
DonaTalk is a two-sided marketplace (Pitchers ↔ Listeners) that monetizes via a
4.9% fee on committed donations. Growth = more funded pitchers meeting more
listeners. So we measure a funnel from **found us → signed up → activated →
booked/committed**, plus the **awareness** inputs that feed the top, plus the
**ops health** that proves the machine runs.

## A. Awareness  → `metrics/awareness-log.csv`
| ID | Metric | Source | Notes |
|----|--------|--------|-------|
| A1 | Sessions / visits (7d) | GA4 (`AW-17050482317` / GA4 id) | app.donatalk.com |
| A2 | Landing sessions (7d) | WordPress analytics | donatalk.com |
| A3 | Indexed pages | Google Search Console | both domains |
| A4 | Search impressions (7d) | GSC | both domains |
| A5 | Search clicks (7d) | GSC | both domains |
| A6 | Avg position (top-10 queries) | GSC | tracked cluster terms |
| A7 | Backlinks / referring domains | `backlink-ledger.md` | do-follow counted |

## B. Funnel  → `metrics/funnel-log.csv`
| ID | Metric | Source | Notes |
|----|--------|--------|-------|
| F1 | Signups (7d) | Firebase `pitchers`+`listeners` / Reddit+GA events | dual profile created |
| F2 | Activated pitchers (funded balance) | Firestore `credit_balance > 0` | key value moment |
| F3 | Meetings booked/reserved (7d) | Firestore `meetings` (`reserved`+) | demand signal |
| F4 | Donations committed (accepted) (7d) | Firestore `meetings.accepted` | = revenue events |

## C. Retention / value  → `metrics/funnel-log.csv` (same file, R columns)
| ID | Metric | Source |
|----|--------|--------|
| R1 | Repeat bookings per active user (30d) | Firestore `meetings` |

## D. Ops health  → `metrics/ops-health-log.csv`
| ID | Metric | Source |
|----|--------|--------|
| H1 | Run outcome (success/fail) | routine runner exit code |
| H2 | Failure root-cause class | `Get-RootCause` classifier |
| H3 | Site probe result (critical paths) | `ops/check-site.ps1` |
| H4 | Deploy result + rollback fired? | `ops/deploy-*` / probe |

## Log schemas
- `awareness-log.csv`: `date_utc,A1,A2,A3,A4,A5,A6,A7,note`
- `funnel-log.csv`: `date_utc,F1,F2,F3,F4,R1,note`
- `ops-health-log.csv`: `ts_utc,run_type,H1,H2,H3,H4,note`

## Metric funnel (the story we optimize)
`A4 impressions → A5 clicks → A1 sessions → F1 signup → F2 activation →
F3 booking → F4 committed donation (revenue)`
Each cycle: find the weakest step-conversion and attack it.

## Baseline — captured 2026-07-09 (GSC + GA4 confirmed)
Source: GSC `donatalk.com` domain property (covers app.donatalk.com), 28-day; GA4 `donatalk` 90-day.
| Metric | Value | Note |
|--------|-------|------|
| A1 GA4 active users (90d) | 364 | 379 new; 2.7K events |
| A3 indexed pages | 10 | +15 not indexed |
| A4 impressions (28d) | 37 | |
| A5 clicks (28d) | 4 | |
| A6 avg position | 12.2 | |
| A7 backlinks | 0 | ledger empty |
| Queries | all branded | donatk/dontalk/downtalk — **zero non-branded** = Obj-2 gap |
| F1–F4 | _pending Firebase Admin read_ | |
| Sitemaps | WP `sitemap_index.xml` ✅ (12 pp); **app: none** → KR2-2a | |
