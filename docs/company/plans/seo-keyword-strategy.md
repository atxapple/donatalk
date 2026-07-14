# DonaTalk — SEO Keyword Strategy

> generated 2026-07-09 · **updated 2026-07-10** (sourced benchmarks + Cluster C competitor) ·
> **updated 2026-07-11** (AI-authenticity-collapse wedge + Commsor *Warm Intro Gap Report 2026* data;
> see `research/2026-07-11-keywords.md` for the transcript) ·
> **updated 2026-07-12** (post-publish SERP check; **MeetMagic competitor correction**; Gated risk note;
> "book meetings without cold email" target; trust-recession hook; see `research/2026-07-12-keywords.md`) ·
> **updated 2026-07-13** (**NEW Cluster D — Listener-side**, first deep pass; leaked-editorial-note fix on
> the 3 live posts; day-2 indexation delta; see `research/2026-07-13-keywords.md`) ·
> **updated 2026-07-14** (**NEW Cluster E — Meeting economics**, first deep pass; day-3 indexation delta;
> listener-side backlink family; see `research/2026-07-14-keywords.md`)

**2026-07-14 — Cluster E (Meeting economics) added.** First deep pass on the "cost per B2B sales meeting"
family (the vocabulary behind `/calculator` and the hub's comparison table): every ranking page is an
appointment-setting agency reciting unattributed ranges; the most-recycled figure ("Clutch $550–$1,700")
**has no traceable primary source**; benchmark publishers demonstrably become citation magnets
(FirstPageSage → sopro/martal/cleverzebo). **And no ungated buyer-side cost-per-meeting calculator exists**
— the "cost per meeting calculator" SERP is 100% internal-meeting-time tools; the one sales-CPM calculator
found is email-gated. Two-surface opportunity: a methodology-transparent benchmarks page (WP) + `/calculator`
vocabulary uplift (app). Cluster/tiers in §1b; backlog #33.

**2026-07-13 — Cluster D (Listener-side) added + publish-hygiene fix.** First deep pass on the
listener-acquisition family flagged 07-12: **8/8 SERP checks on "get paid to take sales meetings"-family
queries have no page answering the listener-side intent**, and autocomplete shows zero suggestions for the
head phrases → category-creation, not capture (details/cluster in §1a below). Also found + fixed same-run:
all 3 live posts had published their internal *"Editorial note (staging)… Do not publish until the
WordPress App Password is rotated"* blocks — a draft-quality signal likely suppressing indexation AND a
public leak of an internal security item. Notes moved to `content/editorial-notes.md`, live posts updated
via new `ops/update-wp-post.mjs`, verified clean; **GSC re-index request needed post-change** (human step).

**2026-07-12 competitor correction (Cluster C).** The first scan of the adjacent **pay-for-access marketplace**
category found **MeetMagic** ([meetmagic.org](https://www.meetmagic.org/)) — a live, 2026-active
donation-for-meeting B2B platform (vendor pays ~US$700/meeting with a C-level exec, ~70% to the exec's chosen
charity; self-reported 3,500+ members / US$1.4M donated; APAC/UK-weighted, curated, enterprise, "pitch-free").
All prior passes missed it. **The blue ocean is the *search surface*, not the category**: MeetMagic ranks only
on brand, and the "donation for a meeting" keyword family remains product-unowned. Surviving differentiators to
anchor all copy: **self-serve · any-vertical · everyday-seller · Listener-chosen cause · 4.9% fee** (vs curated
exec network, fixed price). Never claim "first/only" (live explainer already complies). Also logged: **Gated**
(donation-to-reach-inbox) shut down Sept 2024 citing market size ([goldpenguin](https://goldpenguin.org/blog/gated-bids-farewell/))
— a risk-register data point confirming Cluster C demand must be *manufactured* (unit-economics differ: they
sold inbox filtering at $2/email; we sell booked meetings).

**2026-07-11 headline shift — the wedge got sharper.** The 2026 discourse has moved past "reply rates are
falling" to **"AI made personalized-looking outreach infinite, so it stopped being a signal at all."** When
any seller can auto-generate a 'personal' email, receiving one tells the buyer nothing; trust migrates to
signals that are *costly to fake.* **DonaTalk's committed donation is exactly such a signal** — an AI SDR
can mint a thousand emails a minute but cannot put $50 on the line for the Listener's cause. This is the
strongest, most defensible framing to date. Anchor Cluster A + C copy here.

## 0. Context & method

DonaTalk turns a sales pitch into a charitable donation: a **Pitcher** commits a donation to a non-profit in exchange for a warm intro, and a **Listener** agrees to hear the pitch and directs the donation to a cause they choose. Positioning line: *"What if every sales call also helped a non-profit?"* Revenue is a 4.9% fee on donations across two surfaces — `donatalk.com` (WordPress marketing/blog) and `app.donatalk.com` (the product).

**Current reality:** near-zero non-branded discovery. GSC 28-day = 4 clicks / 37 impressions, all queries branded misspellings. So this strategy is about **manufacturing demand capture**, not harvesting existing brand demand.

**Honesty note on the numbers:** No Ahrefs/Semrush/GSC keyword data on this pass. Volume figures are **rough US estimates inferred from SERP density, autocomplete, People-Also-Ask, competitor content depth, and forum activity** — not tool-confirmed. Every cluster carries a "confirm with a real tool" flag. Order-of-magnitude, not precise.

Two facts shaped the clustering:
1. **The exact-match category ("donation for a meeting", "book a meeting for charity") is nearly empty** — only two thin competitors (Influence Board, live; HearMeOut, an EA-forum beta concept). Low competition, but low existing volume — demand DonaTalk must *create*.
2. **The adjacent category ("cold email alternatives", "warm introductions", "book meetings with executives") is huge and buyer-relevant** — but dominated by well-resourced SaaS blogs. Capture existing demand by inserting DonaTalk into the consideration set.

Strategy: harvest adjacent demand at the top, funnel into the category DonaTalk can own at the bottom.

## 1. Three non-branded keyword clusters

### Cluster A — "Cold email / cold outreach alternatives" (adjacent demand capture)
People who feel the pain DonaTalk solves (1% reply rates) and are shopping for a different approach. High commercial intent, high volume, most competitive.
- **Head:** cold email alternatives
- **Long-tails:** alternatives to cold calling · cold outreach alternatives · cold email vs cold call · what to do instead of cold email · cold email is dead alternatives · better ways to book B2B meetings · fill pipeline without cold email
- **Est. volume (US):** head ~1–3k; "alternatives to cold calling" ~2–5k; long-tails 100–800 each. *Confirm.*
- **Difficulty:** Medium-High. Saturated SaaS listicles (Breakcold, Prospeo, SmartReach, Saleshandy, Commsor, Abstrakt, Vida). Long-tails are softer and winnable with a differentiated angle.
- **Intent:** Commercial-investigational → informational.

### Cluster B — "Warm introductions / warm outreach" (relationship-selling demand)
The category buyers move *toward* when they abandon cold outreach. DonaTalk = buy a warm intro by donating to a cause — owning this vocabulary is core.
- **Sourced demand fact (2026-07-10):** warm-intro reply rates run **20–40% vs cold 1–3%** — an order-of-magnitude lift, cited consistently across independent sources ([askscout.ai](https://askscout.ai/blog/what-is-a-warm-introduction), [launchleads.com](https://www.launchleads.com/lead-generation-strategies/warm-intros-referrals/)). Use this cited *range* in the #17 pillar (replaces the earlier qualitative hedge; keep it a range — the true lift varies by relationship). The gap every source assumes away — *you need a mutual connection* — is exactly what DonaTalk manufactures; that's the bridge into Cluster C.
- **Sourced demand fact (2026-07-11) — the gap is now quantified.** The **Commsor _Warm Intro Gap Report 2026_** (n=1,305 GTM leaders, [commsor.com](https://www.commsor.com/guide/warm-intro-gap-report)) finds **77.8% of leaders would be ready if cold outbound disappeared, but only 18% have a reliable warm-intro system** — a ~60-pt gap that is *exactly* the demand DonaTalk fills (it manufactures the intro for the no-mutual-connection case). Same report: **~1,400 outbound touches per meeting, 5× in 5 years.** Complementary tactic ranking: **warm referrals = 65% effectiveness, #1 by 21 pts** (vs inbound 44 / email 28 / phone 26 — Norwest 2025, via [getboomerang.ai](https://getboomerang.ai/post/cold-outbound-is-dying)). Cite Commsor in the #17 pillar as third-party proof of the gap. **Commsor is a thesis-aligned _non-competitor_** (warm-intro infra, no donation mechanic) — a citation/PR/co-marketing target, not a rival.
- **New on-wedge long-tails (2026-07-11, confirm w/ tool):** warm intro gap · how to get warm intros at scale · warm intro when you have no mutual connection · warm introduction system · how to get referrals without asking your network.
- **Head:** warm introduction (sales) / how to get warm intros
- **Long-tails:** what is a warm introduction · how to ask for a warm intro · warm intro email template · warm intro vs cold outreach · how to get warm introductions B2B · book meetings with hard-to-reach executives · get meetings with C-suite
- **Est. volume (US):** head ~800–2k; template/how-to long-tails 100–600 each; "meetings with executives" sub-cluster ~500–1.5k. *Confirm.*
- **Difficulty:** Medium. Fragmented, less SEO-hardened competition (Scout, Vieu, Commsor, Draftboard, Upcell, Launch Leads, LinkedIn blog). Winnable with a strong pillar + template assets.
- **Intent:** Informational + commercial tail on "meetings with executives".

### Cluster C — "Donation-based outreach / book a meeting for charity" (the ownable category)
Blue-ocean. Almost no competition, almost no *existing* volume — a category DonaTalk must name and create. Lowest near-term traffic, highest strategic value.
- **Head:** donation-based outreach / book a meeting for charity
- **Long-tails:** donate to charity for a meeting · pay to pitch charity · charity for a sales meeting · sell your calendar time to charity · what if every sales call helped a non-profit · charitable sales outreach platform · sales pitch donation
- **Est. volume (US):** very low today (<100/mo per term, several near-zero). Latent/emerging. *Confirm; expect thin data.*
- **Difficulty:** Low. Live players now identified: **Influence Board** (executive-side network), **Time to Give Network** (finance-native, invite/organic — *new find 2026-07-10*), + HearMeOut (beta). **Crucially, none compete on search** — TGN has ~no web/SEO footprint; Influence Board ranks only for its brand. The category's *content* surface is empty, so low current volume is offset by ~zero content competition. DonaTalk can rank #1 fast and *define the vocabulary*.
- **Intent:** Commercial-to-transactional — searchers want the *product*.
- **Positioning (2026-07-10):** both incumbents serve **finance/enterprise executive networks**; neither serves the everyday B2B seller — DonaTalk's stated wedge, uncontested. Frame DonaTalk as the **first *self-serve, seller-side, any-vertical*** donation-for-meeting product (honest — do **not** claim "first/only," they exist). Cultural hook for the explainer: the **"Warren Buffett charity lunch," but self-serve and for any B2B meeting.**

### Cluster D — Listener-side: "get paid (in donations) to take sales meetings" (NEW 2026-07-13 — category creation)
The acquisition side no prior cluster addressed: the prospect/executive who *takes* the meetings. Evidence
(first deep pass, `research/2026-07-13-keywords.md` §3): every literal query misdirects (pay-per-appointment
= seller-pays-agency; call-QA gig work; employment law), autocomplete is null on the head phrases, and the
adjacent "monetize your time" vocabulary is owned by expert networks (GLG "paid consulting opportunities",
Minnect/Clarity/Office Hours) with **zero charity variants anywhere**. MeetMagic uses our exact exec-side
framing ("Turn Your Expertise Into Impact") but ranks for nothing generic in the US.
- **Tier A (real demand today, funnels in):** vendor fatigue / vendor meeting fatigue (weak-medium SERP;
  term ambiguous — half the corpus = vendors' DD fatigue) · expert network side hustle / get paid for
  advice calls (medium-strong; enter as "the charity-powered alternative") · vendor spam / stop vendor
  cold calls (weak-medium, verbatim exec language, no canonical answer).
- **Tier B (null SERPs — own for free; converts via PR/referral + LLM-answer citation, not organic yet):**
  get paid to take sales meetings · get paid to take vendor meetings · turn sales meetings into charity
  donations · your time funds your cause.
- **Tier C (defensive/brand):** meetmagic alternative (real brand demand AU/UK → /vs candidate) · "is it a
  bribe / ethical to accept donations for meetings" (the #1 exec objection per MeetMagic's own FAQ — the
  objection content IS the conversion content) · expert calls for charity.
- **Positioning gold:** expert-network compliance anxiety (execs who can't accept personal payment;
  GLG/AlphaSights forbid selling on calls) → "GLG pays *you* — DonaTalk pays *your cause*." Volunteer time
  is never tax-deductible, but a third-party donation the exec directs costs them nothing.
- **Difficulty:** near-zero content competition; near-zero typed volume today. Strategic value: listener
  supply is the marketplace's other leg, and first mover becomes *the* LLM citation for the concept.
- **2026-07-14 status:** target page shipped — `app.donatalk.com/for-listeners` live (v0.21.0, run 40),
  H1 on the Tier-B head phrase; GSC index requested same-run. Not yet indexed (expected, <24h).

### Cluster E — Meeting economics: "cost per B2B sales meeting" (NEW 2026-07-14 — linkable-asset play)
The vocabulary behind `/calculator` and the hub's cost-per-meeting table (first deep pass,
`research/2026-07-14-keywords.md` §3). SERPs owned end-to-end by appointment-setting agencies (Belkins,
SalesHive, Cleverly, Salesar, RevNew…) writing annual "Pricing Guide + table + FAQ" pages that funnel to
their own service; **no independent/primary source exists** — the niche's most-recycled stat ("Clutch
$550–$1,700/appointment") is untraceable to any primary page, and vendors cite each other. Proven citation
flywheel: FirstPageSage/SPOTIO-style benchmark pages get cited across independent domains.
- **Tier A (real demand today — autocomplete-present; enter via comparison/alternative angle, SERP
  saturated):** b2b appointment setting cost · appointment setting cost per appointment · pay per meeting
  (lead generation / agency / service). DonaTalk is literally a pay-per-meeting variant where the payment
  is a donation to the prospect's cause — the natural differentiated entry.
- **Tier B (latent but vendor-contested — the benchmarks asset):** cost per booked meeting b2b · average
  cost per sales meeting · how much does a b2b sales meeting cost · should you pay for sales meetings
  (weak neutral-content SERPs; cover the question forms as FAQ, not standalone posts).
- **Watch:** "ai appointment setter cost" (emerging autocomplete) — pairs with the 07-11 costly-signal
  wedge ("an AI SDR still can't put $50 on the line for your cause").
- **Term collisions (avoid in titles):** "cost per meeting" bare = internal-meeting-time intent
  (Koalendar/MeetGeek own it) · "cost per appointment" = healthcare · bare "appointment setting"
  autocomplete = job-seeker intent · "cost per SQL" = MS SQL Server licensing noise.
- **Citable-numbers bank** (provenance-flagged, for the asset): fully-loaded SDR ~$142.5k/yr →
  ~$1,083–$1,354/held meeting (SalesHive worked example; RepVue comp = third-party) · SDR cold outbound
  $3,222/SQL vs referral $163 (GrowthSpree, methodology undisclosed) · FirstPageSage $1,357/SQL ·
  PPA menus $50–$750 · show-rate 70–80% correction · the r/sales **$15k/17 ≈ $880/meeting** conference
  comp (quote bank). Full table in research §3c.
- **Difficulty:** medium (saturated vendor SERPs on Tier A) / low-medium on Tier B — but the win condition
  is being the only methodology-transparent node, not outranking head-on. Strategic value: citation
  magnet (KR2-3 do-follow links from the very agency blogs that need numbers), calculator feeder, and
  substantiation for the hub's comparison table.

## 2. Cluster → target page

| Cluster | Target page | Surface | Why |
|---|---|---|---|
| A — Cold email alternatives | blog listicle `donatalk.com/blog/cold-email-alternatives` | **WordPress** | Winning format is an editorial listicle; DonaTalk is the differentiated entry, funnels to app. |
| B — Warm introductions | pillar + template `donatalk.com/blog/how-to-get-warm-introductions` (+ `/warm-intro-email-template`) | **WordPress** | Informational = blog pillar + cluster; internal-link to app `/listeners`, `/pitchers`. |
| C — Donation-based outreach | `app.donatalk.com/listeners`, `/pitchers`, future `/vs` + impact calculator | **App** (+ thin WP explainer) | Transactional intent belongs on the product; own exact-match terms, convert directly. |
| D — Listener-side (NEW 07-13) | **listener-side landing surface** (backlog candidate — `/listeners` as fetched today shows a seller-facing "Browse People to Pitch" CTA to a listener arriving from these queries) + one Tier-A blog post ("vendor meeting fatigue") funneling to it | **App** (+ WP support post) | H1 on the null-SERP head phrase ("Get paid in donations to take sales meetings"); pain section in verbatim exec vocabulary; "Is this a bribe?" objection/FAQ block; contrast vs expert networks + curated platforms. **✅ shipped 07-14: `/for-listeners` (v0.21.0); support post = backlog #32.** |
| E — Meeting economics (NEW 07-14) | WP benchmarks asset **"What a B2B sales meeting really costs (2026 benchmarks)"** + `/calculator` copy/metadata uplift to speak "cost per booked meeting" vocabulary (currently framed as cold-outreach cost only) + hub-table cross-cite | **WordPress** (asset) + **App** (calculator) | Only methodology-transparent page in a self-citing vendor graph → citation magnet (KR2-3) + the sole ungated buyer-side calculator surface. Backlog #33. |

Rule: informational + listicle → WordPress; commercial/transactional + category-defining → app.

## 3. Angle assessment
- **Cold email alternatives** — real, high volume, high competition → Cluster A.
- **Warm intro / warm outreach** — real, medium, winnable, on-core → Cluster B.
- **Book meetings with executives** — real, medium, high buyer intent → fold into B.
- **Donation-based outreach** — ownable, low current volume → Cluster C (category creation).
- **LinkedIn outreach that works** — huge but too competitive & off-core → skip as primary.
- **Cause marketing / GivingTuesday** — wrong audience (nonprofit marketers) → skip for lead-gen.
- **Gifting to book meetings (Reachdesk)** — adjacent, off-core → only a `/vs` comparison point.

### New long-tail candidates (2026-07-12, confirm w/ tool)
- **Cluster A:** "book meetings without cold email" (**weakest SERP of our five targets — no page answers the
  literal query; best next-content ROI**) · "signal-based selling vs cold email" · "why is nobody replying to
  my cold emails" · "inbox fatigue B2B" · "cold email reply rate 2026 benchmark"
- **Cluster B:** "how to close the warm intro gap" — a *response piece citing Commsor's report*, not a
  displacement attempt (Commsor holds 5 of 9 results on the quoted phrase)
- **Cluster C / NEW Listener-side family (first listener-acquisition keywords):** "get paid to take sales
  meetings" · "get paid in donations to take sales meetings" · "your time funds your cause" — near-zero
  product-owned SERPs, nobody owns the prospect-side vocabulary. **Avoid** "pay per meeting/appointment"
  (saturated by lead-gen agencies with the opposite payment direction — mis-categorization risk) and
  "charity auction" family (consumer/celebrity-framed, Charitybuzz-owned).
- **New content hook (Cluster A/C):** the **"trust recession"** (Forrester 2026 "trust gets tested"; "B2B
  credibility crisis") — ladders directly onto the 07-11 costly-signal wedge. Also: Gmail/Microsoft
  deliverability *hard enforcement* (permanent 5xx since Nov 2025) = cold email is getting technically
  harder, not just ineffective.

## 4. Competitor / SERP note
- **A:** SaaS blogs; format = 10–15 item listicle updated for the year — but note (2026-07-10) the top results are mostly "best *tools/software/agencies*" lists. **Angle-shift: write a *channels/approaches* listicle**, not a tools list — softer competition and charity-funded warm intros slots in as a native entry none of them list. Drop "cold email is dead" → "the average is collapsing (5.1%→3.43%), here's what earns a reply now" (61% of decision-makers still prefer cold email; clickbait reads as such to this ICP). **2026-07-11 sharpen:** lead the thesis on the *authenticity collapse* — AI made personalized-looking outreach infinite, so it stopped being a signal ("a signal everyone has access to cannot be an advantage"; Gartner: **75% of buyers will prefer human-led sales over AI by 2030**). Position DonaTalk's committed donation as the **costly, un-fakeable signal** that survives the AI glut. New long-tails: "outbound is dead alternatives" · "authentic sales outreach" · "how to book meetings without cold email."
- **B:** Vieu/Scout/Commsor/Draftboard/etc.; format = definitional pillar + how-to + templates; thinner backlinks → beatable. Own the "**no mutual connection → manufacture one**" section none of them cover.
- **C:** Influence Board (live, exec-side) + **Time to Give Network** (finance-native, no SEO footprint) + HearMeOut (beta); **no dominant content format and ~zero content competition** — whoever publishes the clear definition + `/vs` comparison + calculator owns it. `/vs` + `/calculator` already shipped (v0.13–0.14). **2026-07-11 re-confirm:** a direct search for the donation-**for-access** model returned only nonprofit *fundraising* platforms (CauseVox/GalaBid/Kindful) — not the peer-access model → category search surface still empty, blue-ocean holds. **Commsor** (Warm Intro Gap Report) is thesis-aligned but non-competing (no donation mechanic) — cite/partner, don't fear.
- **Post-publish SERP reality check (2026-07-12, day 1 — see research §1):** our 3 posts not yet indexed; no
  donatalk URL in any target SERP; Google's index holds a **stale "Backup1" homepage title** (live title is
  fixed — needs a GSC re-crawl + index requests, UI-only = human 5-min step). SERP states: Cluster A head is
  *intent-polluted* with tool listicles (our channels-first angle confirmed right — only Breakcold truly
  matches, zero donation mention); Cluster B how-tos all assume an existing mutual connection (our
  differentiator section is the gap); **"what is donation based outreach" SERP is 100% nonprofit-fundraising
  content — no one defines the B2B concept; we can own the definition + snippet once indexed.** C incumbents
  updated: + **MeetMagic** (direct, brand-only SEO footprint — watch for category content). GLG/AlphaSights
  compliance *forbids* selling on expert calls → positioning line: sellers have no sanctioned paid path to
  prospects, except one that funds the prospect's cause.
- **Day-2 delta (2026-07-13, research §1–2):** posts still unindexed (leaked staging notes found+fixed —
  re-request indexing); "Backup1" cached title persists; Cluster A gains a second true channel-match
  ([Tomba](https://tomba.io/blog/cold-email-outreach-alternative)) and SERP snippets now surface warm-intro/
  community framing (intent drifting our way); "book meetings without cold email" confirmed weakest —
  top results answer the *opposite* intent; winning H2 outline recorded in research §4. MeetMagic still
  publishes zero category content — window open.
- **Day-3 delta (2026-07-14, research §1–2):** still 0/4 posts indexed; `/for-listeners` not yet indexed
  (<24h, expected); "Backup1" cached homepage title persists 3+ days post-fix — if still unindexed ~07-16,
  escalate to a site-level quality-signal investigation (#23 site title + #31 hello-world stub are the known
  hygiene items). `/for-listeners` SSR verified by curl (WebFetch sparse-render was a false alarm). Cluster A
  SERP snippets keep drifting toward warm-intro/community framing; prospeo.io/coffee.ai newly surfaced.
  MeetMagic static (no content, no new press; homepage now self-reports $1.4M / 2,900+ connections / 3,500+
  decision-makers — track the connections counter). New-entrant sweep: null.
- **The gap DonaTalk owns:** no one sits at the intersection. Cold-email listicles never mention donation-based outreach; warm-intro guides never mention you can *buy* a warm intro by funding a cause. **Wedge: "donation-based / charitable warm outreach for everyday B2B sellers."**

## 5. First three pieces of content (prioritized)
1. **Listicle (A):** `donatalk.com/blog/cold-email-alternatives` — "11 Cold Email Alternatives That Actually Get Replies in 2026." Feature DonaTalk as the standout. Biggest near-term traffic; builds topical relevance.
2. **Pillar + template (B):** `donatalk.com/blog/how-to-get-warm-introductions` — lead with warm-intro reply-rate stats, introduce donation-based warm intros, ship a downloadable template. On-core, winnable, bridges to C.
3. **Category + explainer (C):** optimize app `/listeners` + `/pitchers` for exact-match terms; publish WP `what-is-donation-based-outreach` as the citable definition; build a `/vs` page. Ranks fast once the site has any authority. Impact calculator is a strong fast-follow.

**Sequencing:** 1 pulls adjacent demand + authority → 2 deepens core + bridges → 3 captures/converts on the owned category. Re-check GSC 4–8 weeks after publishing; double down on whichever cluster gains impressions first.

## Sources
See research transcript (2026-07-09): Saleshandy, Breakcold, Prospeo, SmartReach, Vida, Abstrakt, Instantly, Cleanlist, Scout (askscout.ai), Vieu, Commsor, Draftboard, Launch Leads, OutboundSystem, BeExecutiveEvents, Influence Board, EA Forum (HearMeOut), Reachdesk, Expandi, Martal, ClearB2B, GivingTuesday.
Update transcript (2026-07-10) → `research/2026-07-10-keywords.md`: Martal, Prospeo, Belkins, Apollo, Autobound (reply-rate benchmarks); askscout.ai, Launch Leads, Vieu, Commsor, Introhive (warm-intro stats/how-to); OutboundSystem, BeExecutiveEvents, Koncert (C-suite); **familywealthreport.com — Time to Give Network**; Influence Board. Backlink targets → `research/backlink-targets.md`.
Update transcript (2026-07-12) → `research/2026-07-12-keywords.md`: **meetmagic.org (direct competitor — primary)**,
goldpenguin.org (Gated shutdown), post-publish SERP checks (breakcold, commsor, introhive, gravyty et al.),
instantly.ai 2026 benchmark, forrester (trust recession), talkspresso (expert-call category), charitybuzz/glide
(charity-auction category); new backlink outlets → `research/backlink-targets.md` (2026-07-12 additions).
Update transcript (2026-07-14) → `research/2026-07-14-keywords.md`: appointment-setting pricing SERPs
(salesar, cleverly, saleshive, belkins, danishleadco, demandnexus et al.), firstpagesage + growthspreeofficial
(benchmark citation flywheel), outboundsalespro (gated calculator), Google-suggest probes, meetmagic.org
(day-3 watch); listener-side backlink outlets → `research/backlink-targets.md` (2026-07-14 additions).
Update transcript (2026-07-11) → `research/2026-07-11-keywords.md`: **commsor.com (Warm Intro Gap Report 2026 — primary)**, getboomerang.ai (Norwest 65% / Gartner 75% / compromised-playbook), cirrusinsight.com (Gong 344, Cognism 2.7%, RAIN 82%), marketbetter.ai (SoPro 18%v9%); cause/CSR + podcast/newsletter backlink outlets → appended to `research/backlink-targets.md` (2026-07-11 additions).
