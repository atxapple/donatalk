# DonaTalk - Developer Reference

> Last updated: 2026-03-01 | Version: 0.1.0

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
| Auth | Firebase Auth (email/password) |
| Database | Cloud Firestore |
| Payments | PayPal (REST API + React SDK) |
| Email | SendGrid (@sendgrid/mail) |
| Theme | next-themes (light/dark, default: light) |
| Slugs | slugify |
| Analytics | Google Tag Manager (AW-17050482317) |
| Dev server | Turbopack (`next dev --turbopack`) |

## Project Structure

```
donatalk/
├── app/                          # Next.js App Router (primary)
│   ├── api/                      # API routes (all POST)
│   │   ├── complete-order/
│   │   ├── complete-order-and-update-fund/
│   │   ├── create-meeting/
│   │   ├── create-order/
│   │   ├── escrow-log/
│   │   ├── send-notification/
│   │   ├── send-payment-confirm-email/
│   │   └── send-signup-email/
│   ├── listener/                 # Listener pages (signup, profile, update, arrange-meeting)
│   ├── pitcher/                  # Pitcher pages (signup, profile, update, add-fund)
│   ├── arrange-notification/
│   ├── checkout/
│   ├── choose-a-profile/
│   ├── login/
│   ├── layout.tsx                # Root layout (Navbar, Footer, Providers, gtag)
│   ├── page.tsx                  # Redirects to /login
│   └── providers.tsx             # ThemeProvider wrapper
├── pages/                        # Next.js Pages Router (SSR public profiles)
│   ├── pitcher/[uid].tsx         # Public pitcher profile (SSR)
│   ├── listener/[uid].tsx        # Public listener profile (SSR)
│   ├── _app.tsx
│   └── _document.tsx
├── components/
│   ├── layout/                   # CardContainer, PageWrapper
│   ├── ui/                       # Button, Input, Label, Textarea, Field, shared
│   ├── Footer.tsx
│   ├── LoadingScreen.tsx
│   ├── LogoutButton.tsx
│   └── Navbar.tsx                # Auth state + route protection
├── lib/
│   ├── sendEmailfromListenerPage.ts
│   └── updateFunds.ts
├── firebase/
│   └── clientApp.ts              # Firebase client init (auth + firestore exports)
├── types/
│   ├── listener.ts
│   └── pitcher.ts
├── styles/
│   ├── globals.css
│   └── stitches.config.ts        # Theme tokens (colors, fonts, spacing, radii)
└── public/
    ├── DonaTalk_icon_88x77.png
    ├── logo horizontal with text.png
    └── favicon.ico
```

## Page Routes

### App Router (`app/`)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Redirects to `/login` |
| `/login` | `app/login/page.tsx` | Email/password login |
| `/choose-a-profile` | `app/choose-a-profile/page.tsx` | Switch between Pitcher/Listener roles |
| `/pitcher/signup` | `app/pitcher/signup/page.tsx` | Pitcher registration |
| `/pitcher/profile` | `app/pitcher/profile/page.tsx` | Pitcher dashboard (balance, shareable link) |
| `/pitcher/update-profile` | `app/pitcher/update-profile/page.tsx` | Edit pitcher profile |
| `/pitcher/add-fund` | `app/pitcher/add-fund/page.tsx` | Add funds via PayPal |
| `/listener/signup` | `app/listener/signup/page.tsx` | Listener registration |
| `/listener/profile` | `app/listener/profile/page.tsx` | Listener dashboard |
| `/listener/update-profile` | `app/listener/update-profile/page.tsx` | Edit listener profile |
| `/listener/arrange-meeting` | `app/listener/arrange-meeting/page.tsx` | Meeting arrangement with payment |
| `/checkout` | `app/checkout/page.tsx` | Generic checkout page |
| `/arrange-notification` | `app/arrange-notification/page.tsx` | Notification arrangement |

### Pages Router (`pages/`) - SSR

| Route | File | Purpose |
|-------|------|---------|
| `/pitcher/[uid]` | `pages/pitcher/[uid].tsx` | Public pitcher profile (SSR, no auth) |
| `/listener/[uid]` | `pages/listener/[uid].tsx` | Public listener profile (SSR, no auth) |

## API Routes

All routes are `POST` only, located in `app/api/`.

| Endpoint | Purpose | External Services |
|----------|---------|-------------------|
| `/api/create-order` | Create PayPal order | PayPal |
| `/api/complete-order` | Capture PayPal payment | PayPal |
| `/api/complete-order-and-update-fund` | Capture payment + update pitcher balance | PayPal, Firebase Admin |
| `/api/create-meeting` | Create meeting record in Firestore | Firebase Admin |
| `/api/escrow-log` | Handle listener-to-pitcher escrow payment | PayPal, Firebase Admin, SendGrid |
| `/api/send-notification` | Send meeting interest email to both parties | SendGrid |
| `/api/send-payment-confirm-email` | Send payment confirmation to pitcher | SendGrid |
| `/api/send-signup-email` | Send welcome email on registration | SendGrid |

## Database Schema (Firestore)

### `pitchers/{uid}`
| Field | Type | Description |
|-------|------|-------------|
| `fullName` | string | Full name |
| `email` | string | Email address |
| `pitch` | string | Pitch description / cause |
| `donation` | number | Donation amount per meeting (USD) |
| `credit_balance` | number | Current fund balance (USD, stored as raw number) |
| `slug` | string | URL-safe unique slug (via slugify) |
| `createdAt` | Timestamp | Server timestamp |

### `listeners/{uid}`
| Field | Type | Description |
|-------|------|-------------|
| `fullName` | string | Full name |
| `email` | string | Email address |
| `intro` | string | Brief intro or LinkedIn page link |
| `donation` | number | Requested donation per meeting (USD) |
| `slug` | string | URL-safe unique slug (via slugify) |
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
| `status` | string | `'pending'` (default) |
| `createdAt` | Timestamp | Server timestamp |

### `fund_history/{auto-id}`
| Field | Type | Description |
|-------|------|-------------|
| `amount` | number | Amount added (USD) |
| `eventType` | string | `'add_fund'` |
| `paymentIntentRefId` | string | PayPal order ID |
| `pitcherId` | string | Pitcher UID |
| `timestamp` | Date | Transaction timestamp |

## Type Definitions

```typescript
// types/pitcher.ts
export type Pitcher = {
  fullName: string;
  pitch: string;
  donation: number;
  credit_balance: number;
  email: string;
};

// types/listener.ts
export type Listener = {
  fullName: string;
  intro: string;
  donation: number;
  email: string;
};
```

## Authentication Flow

1. **Login:** `signInWithEmailAndPassword()` via Firebase Auth -> redirect to `/choose-a-profile`
2. **Signup:** `createUserWithEmailAndPassword()` -> creates both `pitchers/{uid}` and `listeners/{uid}` documents (dual-profile system) -> sends welcome email -> redirect to profile
3. **Session:** `onAuthStateChanged()` listener in `Navbar.tsx` tracks auth state client-side
4. **Route protection:** Client-side only (no middleware). Public routes: signup pages and `/pitcher/[uid]`, `/listener/[uid]`. All other routes redirect to `/login` if unauthenticated
5. **Logout:** `signOut(auth)` -> redirect to `/login`

**Important:** Every user gets BOTH a pitcher and listener profile on signup, regardless of which role they sign up as.

## Payment Flow

### Fee Structure
- Platform fee: **12.5%** on top of donation amount
- Formula: `requiredBalance = Math.ceil(donation * 1.125 * 100) / 100`
- Example: $100 donation requires $112.50 in balance

### Pitcher Add Funds
1. Pitcher navigates to `/pitcher/add-fund`
2. Amount is obfuscated in URL query param: `amount * 7900`
3. PayPal button renders via `@paypal/react-paypal-js`
4. On approval: `POST /api/complete-order-and-update-fund`
5. Captures PayPal payment, updates `credit_balance` in Firestore
6. Logs to `fund_history` collection
7. Sends payment confirmation email

### Listener Escrow Payment
1. Listener visits `/listener/[uid]` (pitcher's public page)
2. Fills form (name, email, message) -> redirected to `/listener/arrange-meeting`
3. Escrow amount: `donation * 1.125`
4. PayPal captures payment via `POST /api/escrow-log`
5. Sends notification emails to both parties
6. Creates meeting record

### Pitcher Active Status
- Pitcher's shareable link is **active** only if `credit_balance >= donation * 1.125`
- If insufficient funds, the public page shows an "inactive" message

## Email Integration (SendGrid)

- **BCC on ALL emails:** `atxapplellc@gmail.com`
- **From address:** configured via `SENDGRID_FROM_EMAIL` env var
- **Support email:** `support@donatalk.com`

### Email Types
| Trigger | API Route | Recipients |
|---------|-----------|------------|
| User signup | `/api/send-signup-email` | New user |
| Payment received | `/api/send-payment-confirm-email` | Pitcher |
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

### SendGrid
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

### App
- `NEXT_PUBLIC_BASE_URL` (defaults to `http://localhost:3000`)

## Build & Deploy

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
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
| Email | SendGrid |
| Analytics | Google Ads (AW-17050482317) |
| Source control | GitHub |

## Known Issues

1. **Amount obfuscation is weak:** `amount * 7900` in query params (e.g., `/pitcher/add-fund?a=79000`) is trivially reversible. Not true encryption.
2. **Hardcoded Zoom link:** A single Zoom meeting URL is hardcoded in `send-notification/route.ts` and sent in all meeting emails.
3. **Typos in code:** `encriptedAmount` (should be `encryptedAmount`), `ilstenerId` (should be `listenerId`) in listener/[uid].tsx query params, `PyamentEmailResponse` (should be `PaymentEmailResponse`) in `sendEmailfromListenerPage.ts`.
4. **No server-side auth middleware:** Route protection is client-side only via `Navbar.tsx`. API routes have no authentication checks.
5. **Hardcoded BCC email:** `atxapplellc@gmail.com` is hardcoded in all SendGrid API routes.
6. **Hardcoded domain in emails:** `https://app.donatalk.com` hardcoded in email templates instead of using `NEXT_PUBLIC_BASE_URL`.
7. **Commented-out isActive check:** In `pages/listener/[uid].tsx`, the `isActive` check is commented out (`// const isActive = pitcher.credit_balance >= requiredBalance;`).
8. **Dual routing system:** Hybrid App Router + Pages Router - public profiles use Pages Router for SSR, everything else uses App Router.
9. **Footer copyright year:** Hardcoded as 2025.
10. **No rate limiting** on API routes.
11. **`create-meeting` called after notification error:** In `pages/pitcher/[uid].tsx`, the `create-meeting` API call runs outside the try/catch and after status is already set, regardless of notification success/failure.

## Conventions

- **Styling:** Stitches `styled()` for component-level styles, Tailwind for utility classes. Theme tokens defined in `styles/stitches.config.ts`.
- **Path alias:** `@/*` maps to project root (tsconfig paths).
- **Components:** UI primitives in `components/ui/`, layout wrappers in `components/layout/`.
- **API routes:** All use Next.js App Router route handlers (`route.ts` with named exports like `POST`).
- **Firebase Admin init:** Guarded with `if (!getApps().length)` pattern, repeated in `lib/updateFunds.ts`, `lib/sendEmailfromListenerPage.ts`, and `app/api/create-meeting/route.ts`.
- **Public pages:** Use Pages Router `getServerSideProps` for SSR with Firebase client SDK.
- **Slug generation:** `slugify(fullName)` with uniqueness check via Firestore query; appends counter if duplicate.
- **State management:** No global state library. Auth state via `onAuthStateChanged` in Navbar. Page-level state via `useState`.
- **Loading:** `LoadingScreen` component wraps all pages in layout.
- **Theme:** Light mode default, dark mode support via `next-themes`.
