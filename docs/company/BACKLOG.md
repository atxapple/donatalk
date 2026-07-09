# DonaTalk — Backlog

> Ordered work queue. Each scheduled run advances the top **unblocked** item.
> Status: ⬜ todo · 🟡 in progress · ✅ done · 🔴 BLOCKED
> Last updated: 2026-07-08

## Now (Obj 1 — the machine)
| # | Item | KR | Status |
|---|------|----|--------|
| 1 | Scaffold `docs/company/` company OS (Charter/OKR/Strategy/Metrics/Backlog/Decisions) | 1-3 | 🟡 in progress |
| 2 | Scaffold `ops/` runner + routines + failure classifier + alerting | 1-1 | 🟡 in progress |
| 3 | `ops/check-site.ps1` synthetic probe (home/`/listeners`/signup) + self-clean | 1-4 | ⬜ |
| 4 | `ops/get-metrics.ps1` — append rows to awareness/funnel/ops-health logs | 1-2 | ⬜ |
| 5 | Deploy gate + auto-rollback wrapper (`ops/deploy-web.ps1`) | 1-4 | ⬜ |
| 6 | Register Windows Task Scheduler jobs (3h ops, daily research, weekly report, 6h probe) | 1-1 | 🔴 needs scheduler host |
| 7 | Charter dry-run: trip a money-gate, confirm PR+ALERT path works | 1-3 | ⬜ |

## Now (Obj 2 — visibility, no blockers)
| # | Item | KR | Status |
|---|------|----|--------|
| 8 | `app/robots.ts` + `app/sitemap.ts` | 2-2a | ⬜ |
| 9 | Root + per-page OG/Twitter metadata; fix generic root `<title>` | 2-2a | ⬜ |
| 10 | Per-profile metadata on SSR `pages/(pitcher|listener)/[uid].tsx` | 2-2a | ⬜ |
| 11 | JSON-LD (Organization, WebSite, per-profile Person/Offer) | 2-2a | ⬜ |
| 12 | Keyword-strategy doc — 3 non-branded clusters → target pages | 2-1 | ⬜ |

## Board-provisioned (2026-07-09)
| # | Item | Status |
|---|------|--------|
| 13 | GSC verified (both domains) + baseline pulled | ✅ done; app sitemap still to submit (item 8) |
| 14 | WordPress credential (App Password, admin) stored in Vercel | ✅ done; build publish pipeline next |
| 15 | Autonomous posting — supervised ramp (first 5 posts) | 🔴 needs approved accounts |

## Still blocked on board
- Always-on scheduler host (item 6).
- Approved posting accounts (item 15).
- **Rotate** WordPress App Password (transited chat).

## Later
- `/vs` competitor/comparison pages; cost-of-cold-outreach calculator.
- Cause-story content series (Listeners' non-profits) for donatalk.com blog.
- `.env.example`; API rate limiting; cookie consent (from product backlog).
