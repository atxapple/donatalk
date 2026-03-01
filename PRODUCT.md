# DonaTalk - Product Reference

> Last updated: 2026-03-01 | Version: 0.1.0

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
3. **Add funds** via PayPal at `/pitcher/add-fund` (must cover donation + 12.5% fee)
4. **Share profile link** (e.g., `app.donatalk.com/pitcher/{uid}`) - link is active only when funds are sufficient
5. **Listener fills out form** on public profile -> both get notification email with Zoom link
6. **Meeting happens** -> donation is sent to Listener's non-profit

### Listener Flow (6 steps)
1. **Sign up** at `/listener/signup` (name, email, password, intro/LinkedIn, donation amount)
2. **Receive welcome email** with profile link
3. **Share profile link** (e.g., `app.donatalk.com/listener/{uid}`)
4. **Pitcher visits profile**, fills out form (name, email, availability)
5. **Pitcher escrows payment** (donation + 12.5% fee via PayPal) -> both get notification email
6. **Meeting happens** -> escrowed donation is sent to non-profit

## Feature Status

### Implemented
- User signup/login (Firebase Auth, email/password)
- Dual-profile system (Pitcher + Listener per user)
- Profile management (create, view, update)
- Public shareable profile pages (SSR)
- PayPal fund addition (Pitcher)
- PayPal escrow payment (Listener flow)
- Email notifications (signup, payment, meeting interest)
- Meeting record creation
- Active/inactive link status based on fund balance
- Unique slug generation for profiles
- Google Ads conversion tracking
- Light/dark theme support
- Responsive design

### Not Yet Implemented
- Admin dashboard
- Meeting status tracking (only "pending" exists)
- Meeting completion / donation fulfillment workflow
- Non-profit organization selection / directory
- User-configurable Zoom/meeting links
- Password reset / forgot password
- Social login (Google, etc.)
- Profile image upload
- Search / discovery of Pitchers and Listeners
- Notification preferences
- In-app messaging
- Meeting calendar integration
- Analytics dashboard for users
- Rate limiting on API routes
- Server-side auth middleware
- Cookie consent management
- Proper amount encryption

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

- **Fee:** 12.5% on top of every donation amount
- **Calculation:** `total = donation * 1.125`
- **Example:** For a $100 donation, the Pitcher/escrow pays $112.50. $100 goes to the non-profit, $12.50 is DonaTalk's revenue.
- **Payment processor:** PayPal (additional PayPal fees apply on top)

## Infrastructure & Accounts

| Service | Provider | Notes |
|---------|----------|-------|
| Domain | Cloudflare | donatalk.com, app.donatalk.com |
| Landing page hosting | WordPress | donatalk.com |
| App hosting | Vercel | Auto-deploy from GitHub main branch |
| Database | Firebase / Cloud Firestore | 4 collections: pitchers, listeners, meetings, fund_history |
| Authentication | Firebase Auth | Email/password only |
| Payments | PayPal | Live (production API URL) |
| Transactional email | SendGrid | From: support@donatalk.com |
| Source control | GitHub | Private repository |
| Analytics | Google Ads | Conversion tracking: AW-17050482317 |
| Monitoring BCC | atxapplellc@gmail.com | Receives BCC of all transactional emails |

## Landing Page Status (donatalk.com)

- **Platform:** WordPress with Gutenberg block editor
- **Content:** Product description, how it works, user role explanations
- **Legal pages:** Terms of Service, Privacy Policy (linked from app footer)
- **Known issues:**
  - No cookie consent management (Cookiebot or equivalent) is implemented
  - Footer copyright in app says 2025

## Backlog / TODO

### High Priority
- [ ] Implement meeting completion workflow (mark meetings as completed, trigger donation)
- [ ] Add non-profit organization selection/directory
- [ ] Replace hardcoded Zoom link with user-configurable meeting links
- [ ] Add server-side auth middleware for API route protection
- [ ] Fix typos in codebase (`encriptedAmount`, `ilstenerId`, `PyamentEmailResponse`)
- [ ] Fix commented-out `isActive` check on listener public page

### Medium Priority
- [ ] Replace weak amount obfuscation (`amount * 7900`) with proper approach
- [ ] Move hardcoded BCC email and domain URLs to environment variables
- [ ] Add password reset / forgot password flow
- [ ] Add API rate limiting
- [ ] Create admin dashboard for monitoring meetings and payments
- [ ] Add cookie consent management
- [ ] Fix `create-meeting` call placement in pitcher/[uid].tsx (runs outside try/catch)

### Low Priority
- [ ] Add social login (Google)
- [ ] Profile image upload
- [ ] Search/discovery of Pitchers and Listeners
- [ ] In-app messaging between matched users
- [ ] Meeting calendar integration
- [ ] User analytics dashboard
- [ ] Create `.env.example` file
- [ ] Update footer copyright year to be dynamic
