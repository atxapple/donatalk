# Changelog

All notable changes to DonaTalk are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/). Versioning follows [SemVer](https://semver.org/).

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
