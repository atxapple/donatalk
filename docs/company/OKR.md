# DonaTalk — OKRs

> Cycle 1 | Set 2026-07-08 | Horizon: 48h operational proof, then rolling
> Owner: Board sets objectives; CEO owns key results.

## Obj 1 — Stand up a safe, self-operating operations environment

| KR | Target | Measure | Status |
|----|--------|---------|--------|
| **1-1** | ≥16 consecutive scheduled runs (3h + daily) over 48h complete with success exit, **zero unhandled failures**; every failure auto-classified to an `ALERT-*` file. | `ops/logs/` run history | ⬜ not started |
| **1-2** | `METRICS.md` catalog exists; **100%** of runs append a timestamped row to awareness / funnel / ops-health logs. | metric CSVs | 🟡 catalog + 100% row coverage every run since 2026-07-09. **2026-07-11: awareness A4/A5/A6 are now REAL, not `n/a`** — `ops/gsc-pull.mjs` pulls GSC via a read-only service account (no browser, unattended-capable) and `--log` writes the row. First automated pull: impr 36 / clicks 6 / CTR 16.7% / pos 13.9 / **0 non-branded of 5 queries**. Remaining `n/a`: A1/A2 (GA4/WP analytics), F1–F4 (Firebase Admin). **2026-07-11 (run 26): funnel F1–F4/R1 now REAL** — `ops/get-metrics.mjs` (Linux port of the collector) reads Firestore via Firebase Admin (read-only); first-ever real funnel row: **F1=1 signup(7d), F2=5 activated pitchers, F3=0 booked(7d), F4=0 committed(7d), R1=0** (33 pitchers / 24 listeners / 60 meetings all-time). Remaining `n/a`: A1/A2 (GA4/WP analytics), A3 (GSC UI-only). |
| **1-3** | Governance Charter in force with machine-enforced escalation gates; verified by a dry-run that trips a gate. | `CHARTER.md` + dry-run log | ✅ verified 2026-07-09: money-gate dry-run tripped the §3b scanner in `deploy-web.ps1` — touched `lib/updateFunds.ts`, wrapper exited 10, wrote `ALERT-deploy-20260709T134414Z.txt`, did NOT deploy (change routed to PR, never merged; money edit reverted) |
| **1-4** | Synthetic health probe on app.donatalk.com critical paths every 6h, self-cleaning, auto-rollback wired. | `ops/check-site.ps1` + probe log | 🟡 probe live + green each run (3 paths, 200+marker); auto-rollback wrapper `ops/deploy-web.ps1` built 2026-07-09. **Fixed 2026-07-09: the wrapper (and all `ops/*.ps1`) failed to parse under Windows PowerShell 5.1 — non-ASCII `§`/`—` with no BOM broke `deploy-web.ps1:62`; would have been dead-on-arrival on the scheduler host. Now pure-ASCII + PS5.1 parse-verified; gate-trip path proven live.** 6h cadence still needs scheduler host (item 6). **Rollback branch now self-tested 2026-07-09 via `deploy-web.ps1 -SelfTestRollback` (dry-run rollback + re-probe, no live outage); found+fixed a return-stream bug.** **2026-07-12: wrapper ported to Linux — `ops/deploy-web.mjs`** (same gates/exit codes; tested gate lib; rollback self-test + live §3b gate-trip both re-verified on the Linux host) — production deploys unblocked post-migration. Only true live-fire on a real failing deploy remains (deferred — needs a controlled window, not autonomous prod-break) |

## Obj 2 — Increase DonaTalk's search visibility

| KR | Target | Measure | Status |
|----|--------|---------|--------|
| **2-1** | Keyword-strategy doc: **3 validated non-branded clusters** (volume + difficulty), each mapped to a target page. | `plans/seo-keyword-strategy.md` | ✅ done 2026-07-09 (clusters A/B/C; volumes SERP-inferred, confirm w/ tool). **2026-07-12: Cluster C competitor record corrected** — first scan of the adjacent pay-for-access category found **MeetMagic** (live donation-for-meeting B2B platform, curated/enterprise/APAC; missed by all prior passes) + Gated's 2024 shutdown as a demand-risk note; blue ocean restated as *search-surface* only (still holds — "donation for a meeting" family remains product-unowned). New target: "book meetings without cold email" (weakest SERP of our five, no direct answer exists). First **Listener-side** keyword family identified ("get paid in donations to take sales meetings" — unowned). |
| **2-2** | GSC verified on **both** `donatalk.com` and `app.donatalk.com`; sitemaps submitted; baseline captured (indexed pages, impressions, avg position, top-10 queries); metric funnel defined. | `metrics/` + GSC | ✅ GSC+GA4 confirmed, baseline captured, **both sitemaps submitted** (WP + app) 2026-07-09. **Content-publish path built 2026-07-10:** `ops/publish-wp.mjs` markdown→WP-draft pipeline (dry-run-verified, tested). **CONTENT LIVE 2026-07-11 (board-directed):** all 3 cluster posts published on donatalk.com (200, in WP sitemap) — `/cold-email-alternatives/`, `/how-to-get-warm-introductions/`, `/what-is-donation-based-outreach/`. First non-branded content surface is live; next = GSC indexing + impressions tracking. |
| **2-2a** | App SEO foundation shipped: `app/robots.ts`, `app/sitemap.ts`, OG/Twitter tags, per-profile metadata, JSON-LD. | app source + deploy | ✅ deployed v0.12.0 (PR #21) 2026-07-09; verified live (robots.txt, sitemap 42 URLs, per-profile OG/JSON-LD); probe green |
| **2-3** | ≥ **[TBD after baseline]** do-follow backlinks from ≥ **[TBD]** distinct domains, tracked in `backlink-ledger.md`. | `metrics/backlink-ledger.md` | 🟡 target list built 2026-07-10, **expanded 2026-07-11** (`research/backlink-targets.md` — now +named cause/CSR & social-impact outlets w/ contributor paths [TriplePundit, SSIR, NPQ, Greater Good, Causeartist], sales podcasts/newsletters for guest spots, more GTM communities, + Commsor thesis-partner). Ledger still empty (0) — **execution gated on approved posting accounts (#15)**. Numeric targets still `[TBD]` pending tool baseline. **2026-07-12 additions:** GTM contributor programs w/ explicit paths (GTM Alliance, Sales Enablement Collective), sales Substacks, **social-impact/philanthropy podcasts** (new tier — charity side), **existing roundup listicles to get DonaTalk INTO** (Breakcold's #1-ranking alternatives list, corporate-gifting roundups), **HARO successors** (SOS/Qwoted/Featured.com/MentionMatch) for founder quotes; MeetMagic flagged as anti-target. |

### Open sizing
Numeric targets on 2-1/2-3 are set **after** the GSC baseline lands — sizing them
blind would be guessing. Placeholder `[TBD]` until then.

## Board decisions applied to this cycle (2026-07-08)
- Autonomy: **full auto-deploy** (fenced by Deploy Gates, `CHARTER.md` §4).
- SEO surfaces: **both** app + WordPress.
- Posting: **fully autonomous** (fenced by Posting Guardrails, `CHARTER.md` §7).

## Blockers requiring board action
1. ~~Charter sign-off~~ ✅ done (PR #18, 2026-07-09).
2. ~~Google Search Console verification~~ ✅ confirmed both domains + baseline (2026-07-09).
3. ~~WordPress application-password~~ ✅ obtained, verified (admin), stored in Vercel (2026-07-09). **Rotate — rode through chat.**
4. ~~Always-on scheduler host~~ ✅ Linux host + cron (board migration 2026-07-11).
5. ~~Approved posting accounts/platforms~~ ✅ approved 2026-07-11 (Reddit/LinkedIn/X); credentials still to land in `ops-shared/.env-social`.
