# Changelog

All notable changes to DonaTalk are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/). Versioning follows [SemVer](https://semver.org/).

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
