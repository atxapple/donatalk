# DonaTalk — OKRs

> Cycle 1 | Set 2026-07-08 | Horizon: 48h operational proof, then rolling
> Owner: Board sets objectives; CEO owns key results.

## Obj 1 — Stand up a safe, self-operating operations environment

| KR | Target | Measure | Status |
|----|--------|---------|--------|
| **1-1** | ≥16 consecutive scheduled runs (3h + daily) over 48h complete with success exit, **zero unhandled failures**; every failure auto-classified to an `ALERT-*` file. | `ops/logs/` run history | ⬜ not started |
| **1-2** | `METRICS.md` catalog exists; **100%** of runs append a timestamped row to awareness / funnel / ops-health logs. | metric CSVs | ⬜ not started |
| **1-3** | Governance Charter in force with machine-enforced escalation gates; verified by a dry-run that trips a gate. | `CHARTER.md` + dry-run log | 🟡 Charter drafted, sign-off pending |
| **1-4** | Synthetic health probe on app.donatalk.com critical paths every 6h, self-cleaning, auto-rollback wired. | `ops/check-site.ps1` + probe log | ⬜ not started |

## Obj 2 — Increase DonaTalk's search visibility

| KR | Target | Measure | Status |
|----|--------|---------|--------|
| **2-1** | Keyword-strategy doc: **3 validated non-branded clusters** (volume + difficulty), each mapped to a target page. | `plans/seo-keyword-strategy.md` | ⬜ not started |
| **2-2** | GSC verified on **both** `donatalk.com` and `app.donatalk.com`; sitemaps submitted; baseline captured (indexed pages, impressions, avg position, top-10 queries); metric funnel defined. | `metrics/` + GSC | 🔴 BLOCKED: board must verify GSC |
| **2-2a** | App SEO foundation shipped: `app/robots.ts`, `app/sitemap.ts`, OG/Twitter tags, per-profile metadata, JSON-LD. | app source + deploy | ⬜ not started (no blocker) |
| **2-3** | ≥ **[TBD after baseline]** do-follow backlinks from ≥ **[TBD]** distinct domains, tracked in `backlink-ledger.md`. | `metrics/backlink-ledger.md` | ⬜ not started |

### Open sizing
Numeric targets on 2-1/2-3 are set **after** the GSC baseline lands — sizing them
blind would be guessing. Placeholder `[TBD]` until then.

## Board decisions applied to this cycle (2026-07-08)
- Autonomy: **full auto-deploy** (fenced by Deploy Gates, `CHARTER.md` §4).
- SEO surfaces: **both** app + WordPress.
- Posting: **fully autonomous** (fenced by Posting Guardrails, `CHARTER.md` §7).

## Blockers requiring board action
1. Charter sign-off (§3 escalation model).
2. Google Search Console verification on both domains + service-account read.
3. WordPress application-password / API token for donatalk.com.
4. Always-on scheduler host (Windows Task Scheduler box or VM).
5. Approved posting accounts/platforms.
