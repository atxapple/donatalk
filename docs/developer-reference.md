# DonaTalk - Developer Reference

> Last updated: 2026-07-10 | Version: 0.15.0

## Project Overview

DonaTalk is a two-sided marketplace that connects **Pitchers** (fundraisers who pitch their cause) with **Listeners** (supporters who donate to non-profits after hearing a pitch). The platform turns sales pitches into charitable donations.

- **App URL:** https://app.donatalk.com
- **Landing page:** https://donatalk.com (WordPress, separate from this repo)
- **Tagline:** "Share your cause and connect with supporters"

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.3 (App Router + Pages Router hybrid) |
| UI Library | React 19 |
| Language | TypeScript 5.8 (strict mode) |
| Styling | Stitches (CSS-in-JS) + Tailwind CSS 4.1 |
| Icons | Lucide React |
| Auth | Firebase Auth (email/password + Google Sign-In) |
| Database | Cloud Firestore |
| Payments | PayPal (REST API + React SDK) |
| Email | Nodemailer (SMTP) |
| Theme | next-themes (light/dark, default: light) |
| Slugs | slugify |
| Analytics | Google Tag Manager (AW-17050482317) |
| Testing | Vitest |
| Dev server | Turbopack (`next dev --turbopack`) |

## Project Structure

```
donatalk/
├── app/                          # Next.js App Router (primary)
│   ├── admin/                    # Admin dashboard page
│   ├── api/                      # API routes
│   │   ├── admin/                # GET/PATCH/DELETE: admin dashboard data
│   │   ├── book-meeting-from-balance/  # Pitcher reserves balance, books a listener
│   │   ├── complete-order/             # Phase 3 cleanup pending — internal PayPal capture
│   │   ├── complete-order-and-update-fund/
│   │   ├── create-order/
│   │   ├── create-profiles/            # Dual-profile creation (pitcher/listener/both-stubs)
│   │   ├── meeting/[id]/accept/        # Token-gated accept commit
│   │   ├── meeting/[id]/cancel/        # Visitor cancels their own request
│   │   ├── meeting/[id]/decline/       # Token-gated decline + release
│   │   ├── request-meeting/            # Listener requests a meeting on pitcher's page
│   │   ├── send-notification/
│   │   ├── send-payment-confirm-email/
│   │   ├── send-reset-email/
│   │   └── send-signup-email/
│   ├── listener/                 # Listener pages (signup, profile, update-profile)
│   ├── pitcher/                  # Pitcher pages (signup, profile, update-profile, add-fund)
│   ├── checkout/                 # Phase 3 cleanup pending — generic checkout page
│   ├── choose-a-profile/
│   ├── login/
│   ├── layout.tsx                # Root layout (Navbar, Footer, Providers, gtag)
│   ├── page.tsx                  # Redirects to /login
│   └── providers.tsx             # ThemeProvider wrapper
├── pages/                        # Next.js Pages Router (SSR public profiles)
│   ├── pitcher/[uid].tsx         # Public pitcher profile (SSR + client auth gate)
│   ├── listener/[uid].tsx        # Public listener profile (SSR + client auth gate)
│   ├── _app.tsx
│   └── _document.tsx
├── components/
│   ├── layout/                   # AdminContainer, CardContainer, PageWrapper
│   ├── ui/                       # Button, Input, Label, Textarea, Field, shared
│   ├── Footer.tsx
│   ├── LoadingScreen.tsx
│   ├── LogoutButton.tsx
│   └── Navbar.tsx                # Auth state + route protection
├── lib/
│   ├── adminAuth.ts              # Shared verifyAdmin() for admin API routes
│   ├── adminConfig.ts            # Admin email whitelist + isAdminEmail()
│   ├── constants.ts              # MAX_PENDING_RESERVATIONS, RESERVATION_TTL_DAYS, fee
│   ├── firebaseAdmin.ts          # Shared Firebase Admin SDK init (adminDb, adminAuth)
│   ├── mailer.ts                 # Nodemailer SMTP transporter, FROM/BCC, APP_URL
│   ├── meetingEmails.ts          # Reservation/pending/accept/decline/cancel templates
│   ├── meetingTokens.ts          # HMAC-keyed token generation + constant-time verify
│   ├── safeReturn.ts             # ?return= allowlist (open-redirect protection)
│   ├── updateFunds.ts
│   └── verifyUser.ts             # Firebase ID-token verification (no admin allowlist)
├── firebase/
│   └── clientApp.ts              # Firebase client init (auth + firestore exports)
├── types/
│   ├── listener.ts
│   └── pitcher.ts
├── test/
│   └── helpers.ts                # Shared test utilities (createJsonRequest)
├── styles/
│   ├── globals.css
│   └── stitches.config.ts        # Theme tokens (colors, fonts, spacing, radii)
├── vitest.config.mts             # Vitest config with path aliases (.mts for ESM)
└── public/
    ├── DonaTalk_icon_88x77.png
    ├── logo horizontal with text.png
    └── favicon.ico
```

## Page Routes

### App Router (`app/`)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Redirects to `/listeners` (browse-before-signup acquisition surface) |
| `/listeners` | `app/listeners/page.tsx` | Public browse of live listeners + their causes (SSR, SEO) |
| `/vs` | `app/vs/page.tsx` | SEO comparison page: donation-based outreach vs. cold email vs. paid gifting (static, FAQ JSON-LD) |
| `/admin` | `app/admin/page.tsx` | Admin dashboard (email whitelist protected) |
| `/login` | `app/login/page.tsx` | Email/password + Google login |
| `/choose-a-profile` | `app/choose-a-profile/page.tsx` | Switch between Pitcher/Listener roles |
| `/pitcher/signup` | `app/pitcher/signup/page.tsx` | Pitcher registration |
| `/pitcher/profile` | `app/pitcher/profile/page.tsx` | Pitcher dashboard (balance, shareable link) |
| `/pitcher/update-profile` | `app/pitcher/update-profile/page.tsx` | Edit pitcher profile |
| `/pitcher/add-fund` | `app/pitcher/add-fund/page.tsx` | Add funds via PayPal |
| `/listener/signup` | `app/listener/signup/page.tsx` | Listener registration |
| `/listener/profile` | `app/listener/profile/page.tsx` | Listener dashboard |
| `/listener/update-profile` | `app/listener/update-profile/page.tsx` | Edit listener profile |
| `/checkout` | `app/checkout/page.tsx` | Generic checkout page (Phase 3 cleanup pending — only reachable via `/api/complete-order`) |

### Pages Router (`pages/`) - SSR

| Route | File | Purpose |
|-------|------|---------|
| `/pitcher/[uid]` | `pages/pitcher/[uid].tsx` | Public pitcher profile (SSR, no auth) |
| `/listener/[uid]` | `pages/listener/[uid].tsx` | Public listener profile (SSR, no auth) |

## API Routes

All routes located in `app/api/`.

| Endpoint | Method | Purpose | External Services |
|----------|--------|---------|-------------------|
| `/api/admin` | GET | Admin dashboard data (token + email whitelist) | Firebase Admin |
| `/api/admin/[collection]/[id]` | PATCH | Edit pitcher/listener profile fields (admin only) | Firebase Admin |
| `/api/admin/[collection]/[id]` | DELETE | Soft-delete pitcher/listener profile (admin only) | Firebase Admin |
| `/api/create-order` | POST | Create PayPal order | PayPal |
| `/api/complete-order` | POST | Capture PayPal payment (internal — called only by `complete-order-and-update-fund` and the legacy `/checkout` page) | PayPal |
| `/api/complete-order-and-update-fund` | POST | Capture payment + update pitcher balance | PayPal, Firebase Admin |
| `/api/send-notification` | POST | Send meeting interest email to both parties | Nodemailer |
| `/api/send-payment-confirm-email` | POST | Send payment confirmation to pitcher | Nodemailer |
| `/api/send-reset-email` | POST | Send branded password reset email | Firebase Admin, Nodemailer |
| `/api/send-signup-email` | POST | Send welcome email on registration | Nodemailer |
| `/api/create-profiles` | POST | Create dual pitcher/listener profiles (supports `pitcher`, `listener`, `both-stubs` roles) | Firebase Admin |
| `/api/book-meeting-from-balance` | POST | Pitcher reserves balance and creates a `reserved` meeting on a listener page; emails listener Accept/Decline links | Firebase Admin, Nodemailer |
| `/api/request-meeting` | POST | Listener creates a `pending` meeting on a pitcher page; emails pitcher Accept/Decline links (no balance change) | Firebase Admin, Nodemailer |
| `/api/meeting/[id]/accept` | GET | Token-authenticated email link; commits donation (deducts `credit_balance`, releases `reservedBalance` if applicable, logs fund_history) | Firebase Admin, Nodemailer |
| `/api/meeting/[id]/decline` | GET | Token-authenticated email link; releases reservation if any; sends polite-decline notice | Firebase Admin, Nodemailer |
| `/api/meeting/[id]/cancel` | POST | Visitor cancels their own pending/reserved request; releases reservation; notifies owner | Firebase Admin, Nodemailer |

## Database Schema (Firestore)

### `pitchers/{uid}`
| Field | Type | Description |
|-------|------|-------------|
| `fullName` | string | Full name |
| `email` | string | Email address |
| `pitch` | string | Pitch description / cause |
| `donation` | number | Donation amount per meeting (USD) |
| `credit_balance` | number | Current fund balance (USD, stored as raw number) |
| `reservedBalance` | number (optional) | Sum of amounts reserved for currently-`reserved` meetings. Missing = 0. Available balance = `credit_balance - reservedBalance` |
| `pendingReservationCount` | number (optional) | Count of currently-`reserved` meetings. Missing = 0. Hard-capped at 5 |
| `slug` | string | URL-safe unique slug (via slugify) |
| `isSetUp` | boolean (optional) | Whether the profile has been fully set up. Missing = `true` for backward compat |
| `deletedAt` | Timestamp (optional) | Soft-delete timestamp. If present, profile is hidden from public pages |
| `createdAt` | Timestamp | Server timestamp |

### `listeners/{uid}`
| Field | Type | Description |
|-------|------|-------------|
| `fullName` | string | Full name |
| `email` | string | Email address |
| `intro` | string | Brief intro or LinkedIn page link |
| `donation` | number | Requested donation per meeting (USD) |
| `slug` | string | URL-safe unique slug (via slugify) |
| `isSetUp` | boolean (optional) | Whether the profile has been fully set up. Missing = `true` for backward compat |
| `deletedAt` | Timestamp (optional) | Soft-delete timestamp. If present, profile is hidden from public pages |
| `createdAt` | Timestamp | Server timestamp |

### `meetings/{auto-id}`
| Field | Type | Description |
|-------|------|-------------|
| `meetingsource` | string | `'pitcherPage'` or `'listenerPage'` |
| `listenerId` | string | Listener UID |
| `listenerName` | string | Listener name |
| `listenerEmail` | string | Listener email |
| `pitcherId` | string | Pitcher UID |
| `pitcherName` | string | Pitcher name |
| `pitcherEmail` | string | Pitcher email |
| `availability` | string | Message / available times |
| `donation` | number (optional) | Donation amount (USD) — snapshot of the donating party's per-meeting donation at request time |
| `reservedAmount` | number (optional) | Snapshot of `calculateTotalWithFee(donation)` at request time. Used for commit/release accounting |
| `paymentSource` | string (optional) | `'pitcher-balance'` for v0.8.0+ flow; legacy/unset for older docs |
| `status` | string | `'pending'`, `'reserved'`, `'accepted'`, `'declined'`, `'expired'`, `'cancelled'` |
| `acceptTokenHash` | string (optional) | Base64url sha256 of the HMAC-keyed accept/decline token (raw token never stored) |
| `tokenUsed` | boolean (optional) | One-time-use flag; flipped on first accept/decline/cancel/expire |
| `idempotencyKey` | string (optional) | Client-supplied UUID; duplicate keys short-circuit booking endpoints |
| `reservedAt` | Timestamp (optional) | When the meeting was created; drives the 14-day TTL |
| `respondedAt` | Timestamp \| null | When the owner accepted/declined or visitor cancelled |
| `cancelReason` | string (optional) | `'pitcher-cancel' \| 'listener-cancel' \| 'admin-soft-delete' \| 'pitcher-deleted'` |
| `createdAt` | Timestamp | Server timestamp |

### `fund_history/{auto-id}`
| Field | Type | Description |
|-------|------|-------------|
| `amount` | number | Amount added or committed (USD) |
| `eventType` | string | `'add_fund'` (PayPal deposit) or `'meeting_commit'` (donation committed at accept) |
| `paymentIntentRefId` | string (optional) | PayPal order ID (only for `add_fund`) |
| `pitcherId` | string | Pitcher UID |
| `listenerId` | string (optional) | Listener UID (only for `meeting_commit`) |
| `meetingId` | string (optional) | Meeting doc ID (only for `meeting_commit`) |
| `timestamp` | Date | Transaction timestamp |

## Type Definitions

See `types/pitcher.ts` and `types/listener.ts` for the canonical TypeScript shapes. The Firestore documents also carry `slug`, `createdAt`, and (for pitchers) `reservedBalance` / `pendingReservationCount`, as described in the Schema tables above.

## Authentication Flow

1. **Login (email):** `signInWithEmailAndPassword()` via Firebase Auth -> redirect to `/choose-a-profile`
2. **Login (Google):** `signInWithPopup()` via Firebase Auth with `GoogleAuthProvider` -> checks if Firestore profiles exist -> if new user, creates both profiles as stubs (`isSetUp: false`) via `POST /api/create-profiles` with `role: "both-stubs"` and sends welcome email -> redirect to `/choose-a-profile`
3. **Signup:** `createUserWithEmailAndPassword()` -> creates both `pitchers/{uid}` and `listeners/{uid}` documents (dual-profile system) -> primary role gets `isSetUp: true`, stub role gets `isSetUp: false` -> sends welcome email -> redirect to profile
4. **Session:** `onAuthStateChanged()` listener in `Navbar.tsx` tracks auth state client-side
5. **Route protection:** Client-side only (no middleware). Public routes: signup pages and `/pitcher/[uid]`, `/listener/[uid]`. All other routes redirect to `/login` if unauthenticated. Public SSR pages hide profiles where `isSetUp === false`.
6. **Logout:** `signOut(auth)` -> redirect to `/login`
7. **Password reset:** Login page "Forgot password?" calls `POST /api/send-reset-email` which uses `adminAuth.generatePasswordResetLink()` to generate a reset link, then sends a branded HTML email via Nodemailer. Returns success even for non-existent emails (anti-enumeration).
7. **Profile setup:** Stub profiles (`isSetUp: false`) are marked as set up (`isSetUp: true`) when the user saves via the update-profile page. The `/choose-a-profile` page shows "Set Up" vs "Go to" buttons based on `isSetUp` status.

**Important:** Every user gets BOTH a pitcher and listener profile on signup, regardless of which role they sign up as. The non-primary profile is a stub (`isSetUp: false`) until the user completes it via the update-profile page. Google sign-in users get both profiles as stubs and choose which to set up first.

## Admin Access

- **Route:** `/admin` (client-side page with server-validated API)
- **Protection:** Email whitelist in `lib/adminConfig.ts` — checked both client-side (redirect) and server-side (API returns 403)
- **API:** `GET /api/admin?tab=<tab>` with `Authorization: Bearer <Firebase ID token>` header
- **Admin emails:** `yunyoungmokk@gmail.com`, `atxapplellc@gmail.com`
- **Tabs:** Dashboard (summary stats), Pitchers, Listeners, Meetings, Fund History (sortable tables). Fund History resolves `pitcherId` to pitcher email server-side (falls back to UID if pitcher doc no longer exists).
- **Navbar:** "Admin" link shown only for admin users

## Soft Delete

Profiles can be soft-deleted by admins via the admin dashboard. Soft delete sets `deletedAt` (server timestamp) and `isSetUp: false` on the document — it does NOT remove the Firestore document.

- **Affected pages:** Public profiles (`pages/pitcher/[uid].tsx`, `pages/listener/[uid].tsx`) check both `isSetUp !== false` and `!deletedAt`. The `choose-a-profile` page hides soft-deleted profiles entirely.
- **Restore:** Admins can restore a soft-deleted profile from the admin dashboard, which sets `isSetUp: true` and removes the `deletedAt` field.
- **Independence:** Deleting a pitcher profile does NOT affect the user's listener profile (and vice versa).
- **Referential integrity:** Meetings and fund_history records still reference valid docs (just marked deleted).
- **Admin API:** `PATCH /api/admin/[collection]/[id]` edits fields; `DELETE /api/admin/[collection]/[id]` soft-deletes.

## Payment Flow

### Fee Structure
- Platform fee: **4.9%** on top of donation amount
- Formula: `requiredBalance = Math.ceil(donation * 1.049 * 100) / 100`
- Example: $100 donation requires $104.90 in balance

### Pitcher Add Funds
1. Pitcher navigates to `/pitcher/add-fund`
2. Amount is obfuscated in URL query param: `amount * 7900`
3. PayPal button renders via `@paypal/react-paypal-js`
4. On approval: `POST /api/complete-order-and-update-fund`
5. Captures PayPal payment, updates `credit_balance` in Firestore
6. Logs to `fund_history` collection
7. Sends payment confirmation email

### Two-Phase Booking (v0.8.0+)

The anonymous PayPal escrow path was removed in 0.8.1. Public profile pages now require an authenticated visitor.

**Pitcher books from balance (visitor on `/listener/[uid]`):**
1. Visitor signs in (or signs up — both roles created as stubs); returns to the page via `?return=`.
2. Visitor's pitcher profile must be set up and have `credit_balance - reservedBalance ≥ donation * 1.049`. Otherwise UI shows "Add funds" or "Finish your Pitcher profile".
3. `POST /api/book-meeting-from-balance` creates a `reserved` meeting, increments `reservedBalance` and `pendingReservationCount` (capped at 5), emails the listener Accept/Decline links.
4. Listener clicks `GET /api/meeting/[id]/accept?token=…` → commit: deducts `credit_balance`, releases the reservation, logs `fund_history { eventType: 'meeting_commit' }`, emails confirmation.
5. Or listener clicks `GET /api/meeting/[id]/decline?token=…` → status `declined`, reservation released, polite-decline email sent.
6. Visitor can cancel their own pending request via `POST /api/meeting/[id]/cancel` (also releases reservation).

**Listener requests on `/pitcher/[uid]`:**
1. Same auth gate; visitor must have a set-up listener profile.
2. `POST /api/request-meeting` creates a `pending` meeting (no balance touched) and emails the pitcher Accept/Decline links.
3. Pitcher's accept/decline goes through the same `/api/meeting/[id]/{accept,decline}` endpoints (commit path differs because no reservation existed).

Tokens for accept/decline are HMAC-keyed via `MEETING_TOKEN_SECRET`; only the base64url SHA-256 hash is stored on the meeting doc, with one-time-use enforcement via `tokenUsed`. Meetings have a 14-day TTL (`reservedAt` + `RESERVATION_TTL_DAYS`).

### Pitcher Active Status
- Pitcher's shareable link is **active** only if `credit_balance >= donation * 1.049`
- If insufficient funds, the public page shows an "inactive" message

## Email Integration (Nodemailer SMTP)

- **BCC on ALL emails:** `atxapplellc@gmail.com`
- **From address:** hardcoded as `support@donatalk.com` in `lib/mailer.ts`
- **Support email:** `support@donatalk.com`

### Email Types
| Trigger | API Route | Recipients |
|---------|-----------|------------|
| User signup | `/api/send-signup-email` | New user |
| Payment received | `/api/send-payment-confirm-email` | Pitcher |
| Password reset | `/api/send-reset-email` | Requesting user |
| Meeting interest (from pitcher page) | `/api/send-notification` | Both pitcher + listener |
| Meeting interest (from listener page) | `/api/send-notification` | Both pitcher + listener |

All emails use inline HTML templates with DonaTalk branding (logo, colors).

## Environment Variables

### Firebase (Client)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Firebase (Admin / Server)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### PayPal
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_API_URL` (production: `https://api-m.paypal.com`)

### Email (SMTP)
- `EMAIL_PASSWORD` — SMTP password for `support@donatalk.com` on `mail.donatalk.com:465`
- `MAIL_BCC` (optional) — BCC address for all transactional emails. Defaults to `atxapplellc@gmail.com` when unset (`lib/mailer.ts`).

### Meeting tokens (v0.8.0+)
- `MEETING_TOKEN_SECRET` — base64 secret of ≥ 32 characters. Used by `lib/meetingTokens.ts` to hash accept/decline link tokens. Endpoints throw if unset.

### App
- `NEXT_PUBLIC_BASE_URL` — base URL of the deployed app. Used at request time (e.g., server-side fetches into `/api/...`) and in transactional email templates via `APP_URL` in `lib/mailer.ts`. Falls back to `https://app.donatalk.com` for email links and to `http://localhost:3000` for in-app fetches.

## Build & Deploy

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run Vitest unit tests
```

- **Hosting:** Vercel (auto-deploy from GitHub `main` branch)
- **Domain:** `app.donatalk.com` (Cloudflare DNS)
- **No `.env.example`** - reference the env vars section above

## Infrastructure

| Service | Provider |
|---------|----------|
| Domain registrar | Cloudflare |
| App hosting | Vercel |
| Landing page | WordPress (donatalk.com) |
| Database | Firebase / Cloud Firestore |
| Authentication | Firebase Auth |
| Payments | PayPal |
| Email | Nodemailer (SMTP via mail.donatalk.com) |
| Analytics | Google Ads (AW-17050482317) |
| Source control | GitHub |

## Known Issues

1. **Amount obfuscation is weak:** `amount * 7900` in query params (e.g., `/pitcher/add-fund?a=79000`) is trivially reversible. Not true encryption.
2. **Hardcoded Zoom link:** A single Zoom meeting URL is hardcoded in `app/api/send-notification/route.ts` and sent in all meeting emails. Needs per-user meeting link support.
3. **No server-side auth middleware:** Route protection is client-side only via `Navbar.tsx`. Newer booking endpoints (`book-meeting-from-balance`, `request-meeting`, `meeting/[id]/*`) verify Firebase ID tokens or HMAC tokens, but the older routes (`send-notification`, `send-signup-email`, etc.) still have no auth checks.
4. **Dual routing system:** Hybrid App Router + Pages Router — public profiles use Pages Router for SSR, everything else uses App Router.
5. **No rate limiting** on API routes.
6. **Signup-email link role bug:** `app/api/send-signup-email/route.ts` always wraps the visible link in an `href` to `/pitcher/${userId}` and links the "your profile page" anchor to `/pitcher/profile`, even when the role is `listener`. Visible text uses the correct role.
7. **Phase 3 cleanup pending:** `app/api/complete-order/route.ts` and `app/checkout/page.tsx` are remnants of the old anonymous escrow flow. Removable once `complete-order-and-update-fund` inlines the PayPal capture.

## Conventions

- **Styling:** Stitches `styled()` for component-level styles, Tailwind for utility classes. Theme tokens defined in `styles/stitches.config.ts`.
- **Path alias:** `@/*` maps to project root (tsconfig paths).
- **Components:** UI primitives in `components/ui/`, layout wrappers in `components/layout/`.
- **API routes:** All use Next.js App Router route handlers (`route.ts` with named exports like `POST`).
- **Firebase Admin init:** Most server code uses the shared `lib/firebaseAdmin.ts` (`adminDb`, `adminAuth`). The older `lib/updateFunds.ts` still inlines the `if (!getApps().length)` guard pattern.
- **Public pages:** Use Pages Router `getServerSideProps` for SSR with Firebase client SDK.
- **Slug generation:** `slugify(fullName)` with uniqueness check via Firestore query; appends counter if duplicate.
- **State management:** No global state library. Auth state via `onAuthStateChanged` in Navbar. Page-level state via `useState`.
- **Loading:** `LoadingScreen` component wraps all pages in layout.
- **Theme:** Light mode default, dark mode support via `next-themes`.
- **Testing:** Vitest with co-located test files (`*.test.ts` next to source). Mocks for Firebase, PayPal, and Nodemailer via `vi.mock()` / `vi.hoisted()`. Shared helpers in `test/helpers.ts`.
