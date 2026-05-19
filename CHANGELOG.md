# Changelog

All notable changes to DonaTalk are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/). Versioning follows [SemVer](https://semver.org/).

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
