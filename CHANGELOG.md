# Changelog

All notable changes to DonaTalk are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/). Versioning follows [SemVer](https://semver.org/).

## [0.20.0] - 2026-07-13

### Added (SEO — `/vs` made aware of the curated donation-for-meeting category)
- `app/vs/page.tsx` — new "Within the category: curated vs. self-serve" section (two cards) + matching FAQ entry (auto-included in the FAQPage JSON-LD) + two category keywords (`donation for a meeting`, `executive meetings for charity`). The 2026-07-12 competitor scan found that donation-for-meeting platforms also exist in curated/enterprise form (vetted executive panels, fixed-price meetings, share-to-charity), so the category page now describes that model honestly at category level — no competitor named, no "first/only" claims (Charter Sec 6) — and positions DonaTalk by its real differentiators: self-serve, any vertical, donation set by the pitcher (from $10) to a listener-chosen cause, decline = no charge, 4.9% fee. Static content only, non-§3b.

## [0.19.2] - 2026-07-12

### Security (dependency updates — Dependabot triage, no code changes)
- `package-lock.json` — in-semver-range security bumps via `npm audit fix` (no `--force`), clearing 13 of 17 open Dependabot alerts including the only critical:
  - `vitest` 4.0.18 → 4.1.10 (dev) — **critical** GHSA-5xrq-8626-4rwp (Vitest UI server arbitrary file read/execute) + pulls patched `vite` 7.3.5+ (high GHSA-fx2h-pf6j-xcff `server.fs.deny` bypass, medium launch-editor NTLM disclosure) and `esbuild` 0.28.1+ (low).
  - `@grpc/grpc-js` → 1.9.16 (runtime, transitive of `firebase-admin`) — 4 high crash-on-malformed-message advisories.
  - `protobufjs` → 7.6.5 (runtime, transitive) — high DoS via unbounded Any expansion + medium property shadowing.
  - `form-data` → 2.5.6 (runtime, transitive) — high CRLF injection in multipart field names.
  - `nodemailer` 8.0.1 → 8.0.11 (runtime, in-range patch) — 3 medium advisories (List-* header CRLF injection, jsonTransport file/URL-access bypass, OAuth2 TLS validation). No email logic touched; in-range patch of the library only.
  - `js-yaml` → 4.3.0 (dev, transitive) — medium quadratic-complexity DoS.
- Not fixed here (escalated/deferred): `nodemailer` high GHSA-p6gq-j5cr-w38f needs a **major** bump to 9.0.1+ — §3b email surface, routed to a board-gated PR; `uuid` medium GHSA-w5hq-g745-h8pq needs `firebase-admin` 14 (major on the auth surface) — deferred with the same gating.

## [0.19.1] - 2026-07-11

### Changed (SEO — complete internal-linking of Cluster C app surfaces)
- `app/pitchers/page.tsx` — added the `FurtherReading` block (cold-email alternatives + warm introductions + donation-based-outreach explainer) above the CTA row. v0.19.0 placed `FurtherReading` on `/vs`, `/calculator`, and `/listeners` but skipped `/pitchers` — the highest-priority (sitemap 0.8) Cluster C page and the most topically matched to the seller-audience articles ("cold email alternatives", "how to get warm introductions"). This closes that gap so every Cluster C app surface now passes do-follow link equity and a crawl path to the three live WordPress articles. Static content only, no data-flow or behavior change (non-§3b).

## [0.19.0] - 2026-07-11

### Added (SEO — internal links from the app to the live WordPress content)
- `components/FurtherReading.tsx` (new) — a shared, server-rendered "Further reading" block that links the app's Cluster C surfaces to the three donation-based-outreach articles published live on the WordPress SEO home (donatalk.com) on 2026-07-11. Those posts (`/cold-email-alternatives/`, `/how-to-get-warm-introductions/`, `/what-is-donation-based-outreach/`, all 200 + in the WP sitemap) had **zero inbound links from the app** — this closes the BACKLOG "Next for these" follow-up, giving the new content crawl paths, do-follow link equity between our own properties, and a human discovery route. The article set (href/label/blurb) is centralized in an exported `ARTICLES` constant so anchor text stays consistent; anchors are keyword-rich but describe each article honestly (Charter Sec 6). Static content only, no interactivity/data-flow change (non-§3b).

### Changed
- `app/vs/page.tsx` — added the `FurtherReading` block (all three articles; this is the Cluster C category hub) above the CTA row.
- `app/calculator/page.tsx` — added `FurtherReading` (cold-email alternatives + donation-based-outreach explainer, matching the calculator's cost-of-cold-outreach framing).
- `app/listeners/page.tsx` — added `FurtherReading` (donation-based-outreach explainer + warm-introductions how-to, matching the funnel page's intent).

## [0.18.0] - 2026-07-11

### Added (SEO content — seller-side `/pitchers` landing page)
- `app/pitchers/page.tsx` (new) — the Pitcher-side counterpart to `/listeners`. The strategy (`plans/seo-keyword-strategy.md` Sec 2 + Sec 5.3) names `app/pitchers` as a Cluster C ("donation-based outreach") target surface for exact-match transactional intent, alongside `/listeners`, but no such page existed: `/listeners` is the Listener-side browse + conversion page, leaving the *paying B2B-seller ICP* with no dedicated entry surface. New static server component mirroring the `/vs` convention — hero + positioning line, a 3-step "how pitching works" (seller POV), four "why sellers use it" cards (warm not cold · only pay for a real yes · a signal AI can't fake · works in any vertical), a 5-question FAQ, and full metadata (title via `%s | DonaTalk` template + description + Cluster-C keywords + `alternates.canonical` + OpenGraph/Twitter + `robots`) with WebPage/BreadcrumbList/FAQPage JSON-LD. First-party claims only (from $10, 4.9% fee on committed donations, listener picks the cause, decline = no charge) per Charter Sec 6; cold-outreach framing uses the sourced collapsing-average (~5.1% 2024 → ~3.4% 2026; 1–3% as the warm-vs-cold range) per the 2026-07-10 DECISIONS convention; the AI-authenticity wedge is argument-based (no unverified third-party statistics). Static content only, no data-flow or behavior change (non-§3b).

### Changed
- `app/sitemap.ts` — added `/pitchers` to the static routes (priority 0.8, `monthly`), between `/listeners` (0.9) and `/vs` (0.7).
- `components/Footer.tsx` — added a site-wide keyword-rich footer link to `/pitchers` ("Donation-based outreach for sellers"), matching the existing `/vs` + `/calculator` footer links so the new page has inbound internal links from every page.
- `app/vs/page.tsx` — added a reciprocal cross-link to `/pitchers` in the CTA row (peer Cluster C pages now interlink).

## [0.17.0] - 2026-07-11

### Added (SEO content — AI-authenticity wedge on /vs)
- `app/vs/page.tsx` — landed the sharpened 2026-07-11 positioning (the "AI-authenticity collapse" wedge from `research/2026-07-11-keywords.md` / `plans/seo-keyword-strategy.md`) onto the live category page, where it was previously absent. AI now makes personalized-looking cold outreach infinite, so a polished email no longer signals genuine effort or intent; a *committed donation* is costly to fake and therefore reads as an authentic signal. Added: a new comparison-table row ("In the age of AI outreach"), a fourth differentiator card ("A signal AI can't fake"), a new FAQ entry ("Does donation-based outreach still work now that AI writes cold emails?"), and new keyword targets (`authentic sales outreach`, `AI outreach alternative`, `outbound is dead alternatives`). Argument-based framing only — no unverified third-party statistics (Charter Sec 6, truthful); category-level, non-defamatory; first-party product claims unchanged. Metadata/content only, no data-flow or behavior change (non-§3b).

## [0.16.1] - 2026-07-11

### Added (SEO — /login metadata)
- `app/login/layout.tsx` (new) — server-component metadata carrier for the `/login` route. `page.tsx` is a Client Component (`'use client'`), so it cannot export `metadata`, and the `next/head` `<Head>` it rendered (`title`/`description`) is a **no-op in the App Router** — `/login` was served with the generic root `<title>` and no canonical/OG/Twitter despite being listed in `sitemap.ts` (priority 0.3). The new layout emits full metadata (distinct title via the root `%s | DonaTalk` template — no doubled suffix, per the v0.15.1 fix — plus description, keywords, `alternates.canonical`, OpenGraph + Twitter cards, `robots`), matching the `/vs`, `/listeners`, `/calculator` and `/*/signup` convention. This closes out the last known App-Router `<Head>` no-op among the sitemap'd static routes. First-party, truthful claims only per Charter Sec 6.

### Removed
- `app/login/page.tsx` — deleted the dead `next/head` `<Head>` block (and the unused `import Head`) that rendered nothing under the App Router. Metadata now lives in the sibling `layout.tsx`. No auth/data/behavior change — the login form and Firebase auth logic are untouched (non-§3b).

## [0.16.0] - 2026-07-11

### Added (SEO — signup pages metadata)
- `app/pitcher/signup/layout.tsx` and `app/listener/signup/layout.tsx` (new) — server-component metadata carriers for the two signup routes. Both `page.tsx` files are Client Components (`'use client'`), so they cannot export `metadata`, and the `next/head` `<Head>` blocks they used to render titles/descriptions are **no-ops in the App Router** — the pages were served with the generic root `<title>` and no canonical/OG/Twitter despite being listed in `sitemap.ts` (priority 0.6). The new layouts emit full metadata (distinct title via the root `%s | DonaTalk` template, description, Cluster-C-adjacent keywords, `alternates.canonical`, OpenGraph + Twitter cards, `robots`), matching the `/vs`, `/listeners` and `/calculator` convention. First-party, truthful claims only ($10 minimum flow, decline = no charge) per Charter Sec 6.

### Removed
- `app/pitcher/signup/page.tsx`, `app/listener/signup/page.tsx` — deleted the dead `next/head` `<Head>` blocks (and the unused `import Head`) that rendered nothing under the App Router. Metadata now lives in the sibling `layout.tsx`. No auth/data/behavior change — the signup form logic is untouched (non-§3b).

## [0.15.1] - 2026-07-11

### Fixed (SEO — title tag)
- `app/listeners/page.tsx` — removed the redundant `| DonaTalk` suffix from the page `title` (and the OpenGraph/Twitter titles). The root layout already applies `title.template: '%s | DonaTalk'`, so the explicit suffix produced a doubled brand in the rendered `<title>` (`… | DonaTalk | DonaTalk`). Now renders once via the template, matching `/vs` and `/calculator`. (This doubled-suffix predated v0.15.0 — the old `'Browse listeners | DonaTalk'` title had the same issue — and is corrected here.) Metadata-only, non-§3b.

## [0.15.0] - 2026-07-10

### Added (SEO — Cluster C on the primary funnel page)
- `app/listeners/page.tsx` — brought the app's primary "donation-based outreach" landing/conversion surface to SEO parity with `/vs` and `/calculator`. Previously it carried only a bare `title` + `description`; now it emits full metadata (Cluster C `keywords`, `alternates.canonical`, OpenGraph + Twitter cards, `robots`) plus JSON-LD (`CollectionPage` + `BreadcrumbList` + `FAQPage`). Added a short, visible "How donation-based outreach works" FAQ (3 Q&As) so the page has crawlable Cluster-C body text (the listing itself is dynamic) that matches the `FAQPage` structured data, and added contextual cross-links to `/vs` and `/calculator` from the CTA row. All claims first-party and mirror the live product ($10 minimum, 4.9% fee, decline = no charge) per Charter Sec 6 (truthful only); no data-flow or behavior change.

## [0.14.2] - 2026-07-10

### Changed (SEO — internal linking of Cluster C pages)
- `components/Footer.tsx` — added site-wide footer links to `/vs` ("Donation-based outreach vs. cold email") and `/calculator` ("Outreach impact calculator"). Both pages were in the sitemap but had **no inbound internal links** from the app's navigation, so they got minimal crawl equity and zero human discovery from the main funnel. The footer renders on every page (via `app/layout.tsx`), giving both SEO pages consistent internal links and a visible entry point.
- `app/vs/page.tsx` — added a reciprocal CTA link `/vs` → `/calculator` ("Estimate your donation impact →"). `/calculator` already linked to `/vs`; this closes the loop so the two Cluster C pages cross-link both ways. Non-behavioral; links + copy only (Charter Sec 6, no §3b surface).

## [0.14.1] - 2026-07-10

### Changed (SEO content — Cluster C truthfulness)
- `app/vs/page.tsx` — replaced the stale "sit near a 1% reply rate" cold-email framing (comparison table + FAQ) with the sourced collapsing-average framing: platform reply rates ~5.1% (2024) → ~3.4% (2026), with ~1-3% kept as the low-single-digit cold range. Aligns the live `/vs` page with the sourced benchmark in `research/2026-07-10-keywords.md` and the run-14 DECISIONS convention already applied to the unpublished Cluster A/B/C drafts (Charter Sec 6, truthful-only). No behavior change; copy only.

## [0.14.0] - 2026-07-10

### Added (SEO content — Cluster C)
- `app/calculator/page.tsx` + `app/calculator/OutreachCalculator.tsx` — outreach cost & charitable-impact calculator (`/calculator`). Server component renders SEO metadata + JSON-LD (WebApplication + BreadcrumbList + FAQPage); the interactive math is a client child. Given the visitor's target meetings, donation amount, and an (editable, ~1% default) cold-outreach reply rate, it shows monthly donation impact, DonaTalk's 4.9% fee cost, all-in cost per booked meeting, and the cold-message volume they'd send instead. All outputs are arithmetic on visitor inputs — no invented metrics (Charter Sec 6); first-party facts ($10 minimum, 4.9% fee, decline = no charge) mirror the live product.
- `/calculator` added to `app/sitemap.ts` static routes (priority 0.7, monthly).

## [0.13.0] - 2026-07-09

### Added (SEO content — Cluster C)
- `app/vs/page.tsx` — category-defining comparison page (`/vs`): "Donation-based outreach vs. cold email vs. paid gifting." Static server component with a comparison table, differentiators, how-it-works steps, and an FAQ. Includes WebPage + BreadcrumbList + FAQPage JSON-LD and full metadata (title/description/canonical/OG/Twitter). Compares approaches at the category level (no named competitors) per Charter Sec 6; first-party claims (donation-to-book, listener picks the cause, 4.9% fee, decline = no charge) mirror the live product.
- `/vs` added to `app/sitemap.ts` static routes (priority 0.7, monthly).

## [0.12.0] - 2026-07-09

### Added (SEO foundation)
- `app/robots.ts` — robots.txt allowing public pages, disallowing admin/API/auth-gated routes, pointing to the sitemap.
- `app/sitemap.ts` — dynamic sitemap covering static routes + all public (non-deleted, set-up) listener & pitcher profiles.
- Rich root metadata in `app/layout.tsx`: `metadataBase`, title template, Open Graph + Twitter cards, keywords, canonical.
- Organization + WebSite JSON-LD (schema.org) in the root layout.
- Per-profile SEO on public listener/pitcher pages: title, description, canonical, OG/Twitter, and ProfilePage/Person JSON-LD, rendered in SSR HTML; unavailable profiles marked `noindex`.

## [0.11.1] - 2026-05-23

### Added (admin dashboard — merged from feat/admin-quickwins)
- Per-tab search/filter on the admin tables.
- Color-coded status badges in the Meetings tab.
- Truncate-with-expand for long text fields.
- Explicit "Deleted" badge on soft-deleted rows.
- Meetings tab shows pitcher/listener email instead of name.

### Fixed
- Fund History no longer leaks the raw pitcher UID when the pitcher doc has been deleted.

## [0.11.0] - 2026-05-20

### Added
- **Escrow + refund flow.** The `accepted` meeting state is no longer terminal — the donation now sits in escrow until the meeting actually happens.
  - New meeting statuses: `completed`, `refunded`.
  - New fields on `meetings/{id}`: `acceptedAt`, `escrowedAmount`, `pitcherConfirmed`, `listenerConfirmed`, `completedAt`, `refundedAt`, `completionReason`, `refundReason`.
  - New fund_history `eventType` values: `meeting_fulfilled` (audit marker on completion), `meeting_refund` (positive amount returned to pitcher's credit_balance).
- **New endpoints:**
  - `POST /api/meeting/[id]/confirm-completed` — either party marks the meeting as having happened. Once both parties confirm, transitions to `completed`.
  - `POST /api/meeting/[id]/report-no-show` — either party reports a no-show. Immediate refund: `credit_balance += escrowedAmount`, status `→ refunded`.
- **`lib/meetingCompletion.ts`** — shared `confirmMeetingCompleted`, `refundMeeting`, `autoCompleteIfExpired` helpers. All transactional.
- **Auto-complete rule**: after 30 days of `accepted` with no no-show reports, the meeting auto-transitions to `completed` (assume the meeting happened; donation treated as fulfilled). Constant `ESCROW_TIMEOUT_DAYS = 30`.
- **Dashboard sections** on both `/pitcher/profile` and `/listener/profile`:
  - "Escrowed meetings" (pitcher side) / "Upcoming meetings" (listener side) showing accepted meetings with action buttons: ✓ Meeting happened / ⚠ No-show.
  - Badges showing partial confirmations ("You confirmed", "Listener confirmed", etc.).
- **Post-submit success card** on both public pages (`/listener/{uid}` and `/pitcher/{uid}`):
  - Replaces the bookable form after a successful submit.
  - Explains the 14-day listener-response window AND the escrow + refund rules.
  - Links straight to the relevant dashboard for status tracking.
- **New email templates**:
  - Updated accept-confirmation email explains the escrow + 30-day rule.
  - `sendCompletionEmail` — both parties notified when meeting is fulfilled.
  - `sendRefundEmail` — both parties notified when a no-show triggers a refund.
- **Two new Firestore composite indexes** (`(pitcherId, status, acceptedAt)` and `(listenerId, status, acceptedAt)`) deployed alongside this release.

### Tests
- 15 new vitest cases (8 for `confirm-completed`, 7 for `report-no-show`).
- Total: 299 tests passing.

## [0.10.0] - 2026-05-20

### Added
- **Free-amount add-fund flow with $5 increments.** Pitchers can now top up any multiple of $5 they choose, regardless of the listener's requested donation — letting them carry leftover balance into future meetings.
  - Five presets ($5, $10, $25, $50, $100) plus a custom amount input that snaps to the next $5 on blur.
  - Live "Current balance → After top-up" preview using `InfoLine`.
  - Friendly warning when the chosen amount is below the gap needed to send a specific pending request — but pitcher can still proceed.
  - Optional `?min=<gap>` hint from `/listener/{uid}` for context-aware default selection.
  - Optional `?return=<safe-path>` to bring the pitcher back to whichever page sent them.
- Server-side validation in `/api/create-order` now rejects: negative amounts, $0, non-$5-multiples, amounts over $5000.

### Changed
- `/pitcher/profile` "Add Fund" button now navigates straight to `/pitcher/add-fund` instead of toggling an inline amount input. Simpler, and amount picking lives in one place.
- Listener public page L7 branch (insufficient balance) now redirects to `/pitcher/add-fund?min=<gap>&return=…` — the `min` is a UI hint only; the server never trusts client-supplied amounts.

### Fixed
- **K1 — `amount * 7900` URL obfuscation is gone.** The encoded-amount query param is no longer used anywhere; amount lives in React state on the add-fund page, the server enforces $5 increments + $5000 cap, so a tampered URL can no longer mismatch what the pitcher pays vs. what they think they're paying for.

## [0.9.2] - 2026-05-20

### Changed
- **Redesigned dashboard pages** (`/listener/profile`, `/pitcher/profile`) to match the new public-page design language:
  - **Brief intro / pitch** moved into a labeled IntroCard with auto-linkified URLs (the main fix you asked for).
  - **Donation amount** surfaced via the same StatCard component used on the public pages (listener side).
  - **Pitcher balance** shown as a three-cell breakdown (Available / Reserved / Total) instead of stacked label-value rows.
  - **Share link** now lives in a clean ShareLinkCard with monospace URL + inline copy icon.
  - **Email** demoted to a small InfoLine row (it's not actionable on this page).
  - **CTAs**: primary "Edit profile →" is now the dominant coral button; "Switch to Pitcher/Listener Profile" demoted to a text link below.
- New shared components in `components/ui/profileCards.tsx`: `ShareLinkCard`, `InfoLine`, `InfoLineGroup`, `BalanceBreakdown`. Reused across both dashboard pages.

## [0.9.1] - 2026-05-20

### Changed
- **Redesigned public profile pages** (`/listener/{uid}`, `/pitcher/{uid}`):
  - User intro/pitch text now lives in a bordered "About {firstName}" / "{firstName}'s pitch" card to clearly distinguish from boilerplate copy.
  - URLs in intros/pitches are auto-linkified (displayed without the `https://` prefix, open in a new tab).
  - Donation amount surfaced in a dedicated stat card with emoji icon, large amount, and supporting caption.
  - CTA hierarchy: primary action (Sign up / Add Funds / Set up Profile) is now a full-width coral button; "Log in" demoted to a text link below.
  - Name repetition reduced — first reference uses full name, subsequent uses first name only.
  - Same design pattern applied to all render branches (anonymous gate, stub-setup, add-funds, bookable form, self-visit, pending cap).
- New shared `components/ui/profileCards.tsx` exports `IntroCard`, `StatCard`, `linkify`, `PrimaryCTA`, `SecondaryLink`, `PageHeading`, `PageSubheading`, `SelfVisitBanner` — reusable across both pages and any future variant.

## [0.9.0] - 2026-05-20

### Added
- **In-app Accept/Decline buttons** on both dashboards:
  - `/listener/profile` "Incoming pitch requests" — each card now has green Accept / red Decline buttons.
  - `/pitcher/profile` "Incoming requests" — same buttons for pending listener requests.
- New endpoint `POST /api/meeting/[id]/respond` taking `{ action: 'accept' | 'decline' }` with Firebase ID-token auth. The caller's uid must match the page-owner role for the meeting (listener for `reserved`, pitcher for `pending`).
- Shared `lib/meetingActions.ts` extracts the accept/decline transaction logic. Both the existing token-link GET routes and the new auth-POST route call the same helper — sub-branches like expiry, pitcher-soft-delete, and insufficient-balance behave identically across surfaces.

### Changed
- The Accept/Decline result kind `'invalid-token'` renamed to `'invalid-auth'` (now covers both wrong-token and wrong-caller cases in the shared helper). Existing route tests updated.
- Dashboard inboxes no longer say "use the email link" — accept/decline is now first-class in-app.

## [0.8.4] - 2026-05-20

### Changed
- `/listener/arrange-meeting` now permanently redirects (308) to `/` via `next.config.ts`. Previously, the Pages Router catch-all `/listener/[uid]` matched the path with `uid="arrange-meeting"`, failed the Firestore lookup, and rendered "Listener not found" with HTTP 200 — confusing crawlers and dead-ending users on stale links from before the anonymous-escrow flow was removed in 0.8.1.

## [0.8.3] - 2026-05-19

### Fixed
- **Navbar was stripping `?return=` off the URL on initial /login load.** The auth-state-change listener treated `/login` as a non-public path and called `router.push('/login')` on every unauthenticated mount, clobbering the query string before the user could submit. Added `/` and `/login` to publicPaths. Diagnosed via Playwright pushState interception (the URL went `/login?return=…` → `/login` → `/choose-a-profile` instead of `/login?return=…` → `/listener/{uid}`).

## [0.8.2] - 2026-05-19

### Fixed
- **`?return=` was ignored on login + signup + update-profile + add-fund** in production. Root cause: those pages are statically prerendered (`○` in build output), and `useSearchParams()` from `next/navigation` returned null on static routes, so the captured `returnPath` was null when the submit handler fired — every login fell through to `/choose-a-profile` regardless of the URL param. Replaced the hook with a `readReturnPath()` helper that parses `window.location.search` at submit time. Caught by Playwright e2e test (login + return roundtrip). Affected files: app/login/page.tsx, app/pitcher/signup/page.tsx, app/listener/signup/page.tsx, app/pitcher/update-profile/page.tsx, app/listener/update-profile/page.tsx, app/pitcher/add-fund/page.tsx.

## [0.8.1] - 2026-05-19

### Added
- **Forced sign-up gate** on public profile pages:
  - `/listener/{uid}`: anonymous visitors see a Sign-Up-as-Pitcher / Log-In gate. Authenticated pitchers see a pre-filled bookable form (or stub-completion / add-funds prompts based on state). The Book button reserves balance and calls `POST /api/book-meeting-from-balance`.
  - `/pitcher/{uid}`: same shape, mirrored — visitors gate to Sign-Up-as-Listener / Log-In, then send the request via `POST /api/request-meeting` (no balance touched).
- Self-visit shows the visitor view with a "👁️ You're viewing your own page" banner; submit button disabled (server also returns 400).
- Owner profile dashboards now include inbox sections:
  - `/pitcher/profile`: "Available balance" / "Reserved" / "Total" breakdown; "Pending pitches" section with Cancel buttons (calls `/api/meeting/[id]/cancel`); "Incoming requests" section (read-only, action via email)
  - `/listener/profile`: "Incoming pitch requests" section (read-only, action via email)
- Auto-recovery for orphan profiles: signed-in user without a pitcher (or listener) doc triggers `POST /api/create-profiles` `role:both-stubs` to repair the dual-profile invariant.

### Changed
- Public profile pages now use Firebase auth state on top of the existing SSR data fetch — Pages Router for SSR, client-side `onAuthStateChanged` for branch decisions.

### Removed
- `app/listener/arrange-meeting/page.tsx` — replaced by balance-based booking
- `app/api/escrow-log/route.ts` and its tests — anonymous PayPal escrow path no longer wired

### Fixed
- Vercel production build was failing on 0.8.0 because Next.js 15 rejects non-handler exports from `app/api/*/route.ts`. Moved `MAX_PENDING_RESERVATIONS` and `RESERVATION_TTL_DAYS` to `lib/constants.ts`.
- Added 39 missing test scenarios from a coverage audit (boundary `?return=` validation, transaction-body assertions for `book-from-balance` and `accept`, soft-delete edge cases, admin sweep listener-side and terminal-state guards).

## [0.8.0] - 2026-05-19

### Added
- Generic `?return=` deep-link mechanism on login, both signup pages, both update-profile pages, and add-fund — strictly allowlisted to `/listener/{uid}` and `/pitcher/{uid}` to prevent open-redirect (`lib/safeReturn.ts` + 28 tests)
- Server endpoints for two-phase booking (dark — not yet wired into UI):
  - `POST /api/book-meeting-from-balance` — pitcher books a listener using their `credit_balance`; creates `reserved` meeting + reserves balance + emails listener Accept/Decline links
  - `POST /api/request-meeting` — listener requests a meeting on a pitcher's page; creates `pending` meeting + emails pitcher Accept/Decline links (no balance touched)
  - `GET /api/meeting/[id]/accept?token=X` — commit donation; handles `reserved` and `pending` flows; checks 14-day TTL; releases reservation if pitcher soft-deleted
  - `GET /api/meeting/[id]/decline?token=X` — release reservation + polite-decline email
  - `POST /api/meeting/[id]/cancel` — visitor withdraws their own request; notifies the page owner
- `lib/verifyUser.ts` — Firebase ID-token verification helper without admin allowlist
- `lib/meetingTokens.ts` — HMAC-keyed token generation and constant-time verification (env: `MEETING_TOKEN_SECRET` required)
- `lib/meetingEmails.ts` — reservation, pending request, decline, cancellation, and accept-confirmation email templates
- Admin soft-delete (`DELETE /api/admin/[collection]/[id]`) now sweeps related `pitcher-balance` meetings: cancels them and releases any reserved balance
- Pitcher schema additions: `reservedBalance`, `pendingReservationCount`
- Meeting schema additions: `paymentSource`, `reservedAmount`, `acceptTokenHash`, `tokenUsed`, `idempotencyKey`, `reservedAt`, `respondedAt`, `cancelReason`
- Meeting status values added: `reserved`, `accepted`, `declined`, `expired`, `cancelled`
- Fund-history `eventType` value added: `meeting_commit`
- New env var: `MEETING_TOKEN_SECRET` (≥32 chars; endpoints throw if unset)
- Plan doc: `docs/plans/2026-05-19-forced-signup-and-booking.md` (state machines, security spec, phasing, acceptance scenarios)

### Changed
- Hard cap of 5 simultaneous `reserved` meetings per pitcher (configurable later)
- Idempotency enforced on booking endpoints via client-supplied `idempotencyKey`

### Fixed
- Vitest 4.0.18 + Node 22 `ERR_REQUIRE_ESM` loading `vitest.config.ts` — renamed to `vitest.config.mts`

### Not yet shipped (Phase 3, separate release)
- Public profile pages `/listener/{uid}` and `/pitcher/{uid}` still use the existing anonymous PayPal flow; the new endpoints are deployed dark.
- Dashboard inbox of incoming requests (listener and pitcher sides).
- Deletion of `app/listener/arrange-meeting/page.tsx`, `app/api/escrow-log/route.ts`, `app/api/complete-order/route.ts`.

## [0.7.0] - 2026-03-08

### Changed
- Platform fee reduced from 12.5% to 4.9%
- Centralized platform fee configuration in `lib/constants.ts`
- Terms of Service updated to remove specific fee numbers for better maintainability
- Unit tests refactored to use dynamic fee calculations

## [0.6.1] - 2026-03-01

### Changed
- Fund History admin tab now shows pitcher email instead of UID (resolved server-side, falls back to UID if pitcher doc deleted)
- Copyright year in footer and all email templates now uses dynamic `new Date().getFullYear()`

### Added
- `POST /api/send-reset-email` — branded password reset email via Nodemailer (replaces Firebase default)
- "Forgot password?" flow on login page calls custom API for DonaTalk-branded emails
- Tests for `adminAuth`, `send-reset-email`, `create-profiles` (36 new tests, 156 total)
- `EMAIL_PASSWORD` env var added to Vercel production
- Privacy policy and terms of service docs

### Fixed
- Next.js 15.3.1 → 15.3.9 to patch CVE-2025-66478 (RCE in React Server Components)
- Removed hardcoded 2025 copyright year (known issue #9 resolved)

## [0.6.0] - 2026-03-01

### Added
- Admin dashboard (`/admin`) with sortable tables for Pitchers, Listeners, Meetings, Fund History
- Admin edit modal (PATCH) for pitcher/listener profile fields
- Admin soft-delete (DELETE) with restore capability
- `lib/adminAuth.ts` — shared `verifyAdmin()` for admin API routes
- `PATCH /api/admin/[collection]/[id]` — edit profile fields, auto-regenerate slug on name change
- `DELETE /api/admin/[collection]/[id]` — soft-delete (sets `deletedAt` + `isSetUp: false`)
- Google Sign-In on login and signup pages
- `POST /api/create-profiles` — dual profile creation (pitcher, listener, both-stubs roles)
- `lib/googleAuth.ts` — Google auth helpers (`signInWithGoogle`, `checkProfilesExist`)
- `deletedAt` field on pitcher/listener types for soft-delete support
- Public pages and choose-a-profile check `deletedAt` to hide soft-deleted profiles

## [0.5.0] - 2026-02-28

### Added
- Marketing assets: LinkedIn carousel, Google display banners, social media cards, ad copy
- Marketing plan for sales professional acquisition
- Comprehensive unit test suite (103 tests across 13 files)

### Changed
- Replaced SendGrid with Nodemailer SMTP for all email sending
- ESLint config updated for Next.js 15 compatibility

## [0.4.0] and earlier

Pre-changelog versions. Core platform features: pitcher/listener signup, PayPal payments, meeting creation, email notifications, public SSR profiles.
