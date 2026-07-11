# DonaTalk - Product Reference

> Last updated: 2026-07-11 | Version: 0.17.0

## Product Vision

**Tagline:** "Share your cause and connect with supporters"

**What DonaTalk does:** DonaTalk creates meaningful connections by turning sales pitches into charitable donations. Entrepreneurs and cause advocates (Pitchers) share their stories with interested supporters (Listeners), and donations flow to non-profit organizations as a result of these conversations.

**Value proposition:** Instead of cold outreach, Pitchers get warm introductions by committing to donate to the Listener's chosen non-profit. Listeners get to hear interesting pitches while supporting causes they care about.

## Platform Architecture

DonaTalk operates across two platforms:

| Platform | URL | Technology | Purpose |
|----------|-----|-----------|---------|
| **Landing page** | donatalk.com | WordPress | Marketing, SEO, info pages |
| **Web app** | app.donatalk.com | Next.js 15 on Vercel | Core product (signup, profiles, payments, meetings) |

## User Roles

### Pitcher
A person who wants to share their cause, product, or story. They:
- Create a profile with their pitch description
- Set a donation amount they're willing to give per meeting
- Add funds to their account (via PayPal)
- Share their public profile link to attract Listeners
- Donate to the Listener's chosen non-profit after meetings

### Listener
A person who wants to hear pitches and direct donations to non-profits. They:
- Create a profile with their intro (bio or LinkedIn)
- Set a donation amount they expect per meeting
- Share their public profile link to attract Pitchers
- Receive donations to their chosen non-profit after meetings

**Important:** Every user gets both roles on signup. They can switch between Pitcher and Listener profiles via the "Choose a Profile" page.

## User Workflows

### Pitcher Flow (6 steps)
1. **Sign up** at `/pitcher/signup` (name, email, password, pitch description, donation amount)
2. **Receive welcome email** with profile link
3. **Add funds** via PayPal at `/pitcher/add-fund` (must cover donation + 4.9% fee)
4. **Share profile link** (e.g., `app.donatalk.com/pitcher/{uid}`) - link is active only when funds are sufficient
5. **Listener fills out form** on public profile -> both get notification email with Zoom link
6. **Meeting happens** -> donation is sent to Listener's non-profit

### Listener Flow (6 steps)
1. **Sign up** at `/listener/signup` (name, email, password, intro/LinkedIn, donation amount)
2. **Receive welcome email** with profile link
3. **Share profile link** (e.g., `app.donatalk.com/listener/{uid}`)
4. **Pitcher visits profile** (signed in, with funded balance), fills name/email/availability
5. **Pitcher books from balance** — the listener's required amount (donation + 4.9% fee) is reserved against the Pitcher's `credit_balance`; both get notification email with Accept/Decline links
6. **Listener accepts** via email link -> reservation commits to a donation; **declines** -> reservation released
7. **Meeting happens** -> committed donation is sent to non-profit

## Feature Status

### Implemented
- User signup/login (Firebase Auth: email/password + Google Sign-In)
- Dual-profile system (Pitcher + Listener per user; signup creates both, one as a stub)
- Profile management (create, view, update); self-serve profile completion of stubs
- Public shareable profile pages (SSR) with client-side auth gate (forced sign-up to book)
- PayPal fund addition (Pitcher)
- Two-phase booking: pitcher reserves from `credit_balance` → listener accepts/declines via email → commit/release
- Meeting status state machine: `pending`, `reserved`, `accepted`, `declined`, `expired`, `cancelled`
- 14-day reservation TTL + HMAC-signed accept/decline tokens (one-time-use)
- Cap of 5 concurrent reservations per Pitcher
- Visitor-side cancel for their own pending/reserved request
- Email notifications (signup, payment, password reset, meeting reservation/pending/accept/decline/cancel)
- Branded password-reset emails via Nodemailer (anti-enumeration response)
- Admin dashboard (`/admin`): sortable tables, edit modal, soft-delete + restore, fund-history with resolved pitcher emails
- Active/inactive link status based on Pitcher's available balance (`credit_balance - reservedBalance`)
- Unique slug generation for profiles
- Soft delete: profiles hidden from public + chooser; admin sweep cancels related reserved meetings
- Open-redirect-safe `?return=` on login/signup/update-profile/add-fund (allowlist)
- Google Ads conversion tracking
- Light/dark theme support
- Responsive design

### Not Yet Implemented
- Meeting completion / donation fulfillment workflow (acceptance commits balance, but the actual donation transfer to a non-profit still happens off-platform)
- Non-profit organization selection / directory
- User-configurable Zoom/meeting links (still a single hardcoded Zoom URL)
- Profile image upload
- Search / discovery of Pitchers and Listeners
- Notification preferences
- In-app messaging
- Meeting calendar integration (.ics, Google Calendar)
- Analytics dashboard for users
- Rate limiting on API routes
- Server-side auth middleware (only the booking endpoints currently verify Firebase ID tokens)
- Cookie consent management
- Proper amount encryption (current `amount * 7900` URL obfuscation is trivially reversible)
- Dashboard inbox for incoming requests on the pitcher/listener sides (action is currently email-only)

## User Flow Diagram

```
                    ┌─────────────┐
                    │   Landing   │
                    │ donatalk.com│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Login    │
                    │   /login    │
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │    Choose a Profile     │
              │  /choose-a-profile      │
              └─────┬──────────┬────────┘
                    │          │
          ┌─────────▼──┐  ┌───▼──────────┐
          │  Pitcher   │  │   Listener   │
          │  Profile   │  │   Profile    │
          └─────┬──────┘  └───┬──────────┘
                │             │
        ┌───────┼───────┐     │
        │       │       │     │
   ┌────▼──┐ ┌─▼────┐ ┌▼───┐ ┌▼────────────┐
   │Update │ │ Add  │ │Share│ │   Share     │
   │Profile│ │Funds │ │Link │ │   Link      │
   └───────┘ └──┬───┘ └──┬──┘ └──┬──────────┘
                │        │       │
           ┌────▼────┐   │   ┌───▼───────────┐
           │ PayPal  │   │   │ Public        │
           │Checkout │   │   │ Listener Page │
           └─────────┘   │   └───┬───────────┘
                         │       │
                  ┌──────▼───┐   │  Pitcher fills form
                  │ Public   │   │  + escrows payment
                  │ Pitcher  │   │
                  │ Page     │ ┌─▼────────────┐
                  └────┬─────┘ │ Escrow       │
                       │       │ Payment      │
           Listener    │       └──┬───────────┘
           fills form  │          │
                  ┌────▼─────┐    │
                  │Notify    │◄───┘
                  │Both via  │
                  │Email     │
                  └────┬─────┘
                       │
                  ┌────▼─────┐
                  │ Meeting  │
                  │(via Zoom)│
                  └──────────┘
```

## Revenue Model

- **Fee:** 4.9% on top of every donation amount
- **Calculation:** `total = donation * 1.049`
- **Example:** For a $100 donation, the Pitcher/escrow pays $104.90. $100 goes to the non-profit, $4.90 is DonaTalk's revenue.
- **Payment processor:** PayPal (additional PayPal fees apply on top)

## Infrastructure & Accounts

| Service | Provider | Notes |
|---------|----------|-------|
| Domain | Cloudflare | donatalk.com, app.donatalk.com |
| Landing page hosting | WordPress | donatalk.com |
| App hosting | Vercel | Auto-deploy from GitHub main branch |
| Database | Firebase / Cloud Firestore | 4 collections: pitchers, listeners, meetings, fund_history |
| Authentication | Firebase Auth | Email/password + Google Sign-In |
| Payments | PayPal | Live (production API URL) |
| Transactional email | Nodemailer (SMTP) | From: support@donatalk.com via mail.donatalk.com |
| Source control | GitHub | Private repository |
| Analytics | Google Ads | Conversion tracking: AW-17050482317 |
| Monitoring BCC | atxapplellc@gmail.com | Receives BCC of all transactional emails |

## Landing Page Status (donatalk.com)

- **Platform:** WordPress with Gutenberg block editor
- **Content:** Product description, how it works, user role explanations
- **Legal pages:** Terms of Service, Privacy Policy (linked from app footer)
- **Known issues:**
  - No cookie consent management (Cookiebot or equivalent) is implemented

## Backlog / TODO

### High Priority
- [ ] Implement meeting completion workflow (mark meetings as completed, trigger off-platform donation transfer)
- [ ] Add non-profit organization selection/directory
- [ ] Replace hardcoded Zoom link with user-configurable meeting links
- [ ] Add server-side auth middleware so legacy API routes (`send-notification`, `send-signup-email`, etc.) verify Firebase ID tokens
- [ ] Phase 3 cleanup: inline the PayPal capture into `complete-order-and-update-fund` so `complete-order` and `/checkout` can be removed
- [ ] Fix `send-signup-email` always linking to `/pitcher/${userId}` and `/pitcher/profile` (should respect role)

### Medium Priority
- [ ] Replace weak amount obfuscation (`amount * 7900`) with proper approach
- [ ] Add API rate limiting
- [ ] Add cookie consent management
- [ ] Dashboard inbox UI for incoming pending requests (currently action is email-only)
- [ ] Surface reserved/available balance breakdown in pitcher dashboard with better UX

### Low Priority
- [ ] Profile image upload
- [ ] Search/discovery of Pitchers and Listeners
- [ ] In-app messaging between matched users
- [ ] Meeting calendar integration (.ics / Google Calendar)
- [ ] User analytics dashboard
- [ ] Create `.env.example` file
