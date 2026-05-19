# Forced Sign-Up + Two-Phase Booking

> Created: 2026-05-19 | Target version: 0.8.0 | Status: implementation-in-progress

## 1. Goal

Public profile pages (`/listener/{uid}` and `/pitcher/{uid}`) require an authenticated identity before a meeting request can be sent. After auth, the visitor returns to the originating page to continue. Money commits in two phases (reserve → accept) so neither party loses control of their funds without consent.

## 2. Non-goals

- Meeting confirmation / no-show / fulfillment workflow (donation actually leaving DonaTalk's account).
- Donation-to-nonprofit transfer mechanism.
- Rate limiting on booking endpoints (separate v2 work).
- Admin notifications when meetings expire.
- Profile / account deletion flow (only soft-delete exists today).

## 3. Key product trade-off

The current anonymous PayPal escrow flow on `/listener/{uid}` (visitor fills form + pays via PayPal in one shot) is **removed**. New visitors must sign up before they can send a request. This raises friction for first-time use but produces real account-tied meetings, eliminates phantom counterparties, and unlocks both-side identity for follow-up emails and a dashboard inbox.

## 4. State machines

### 4.1 `/listener/{uid}` — visitor is a Pitcher, money source is visitor

| # | Auth | Visitor's pitcher profile | Listener doc gates | Render |
|---|---|---|---|---|
| L0 | — | — | missing | "Listener not found." |
| L1 | — | — | `isSetUp:false` OR `deletedAt` | "This profile is not yet available." |
| L2 | logged in | — | viewer.uid === listener.uid | Render visitor view + banner "👁️ You're viewing your own page as a visitor. [Go to your dashboard]"; submit button disabled. Server returns 400 on attempt. |
| L3 | not logged in | n/a | OK | Card with listener intro + "Sign up as Pitcher to talk to {name}" → `/pitcher/signup?return=/listener/{uid}` + "Log in" → `/login?return=/listener/{uid}` |
| L4 | logged in | no pitcher doc (orphan) | OK | Auto-recover via `POST /api/create-profiles` `role:both-stubs`, then → L5 |
| L5 | logged in | pitcher stub (`isSetUp:false`) | OK | "Finish your Pitcher profile" → `/pitcher/update-profile?return=/listener/{uid}` |
| L6 | logged in | pitcher soft-deleted | OK | "Your Pitcher profile was removed. Contact support@donatalk.com" |
| L7 | logged in | pitcher set up, balance + reservedBalance constraints | balance available < required | Pre-filled form (name/email read-only or editable per spec §6) + "Add funds to send request" → `/pitcher/add-fund?a=...&return=/listener/{uid}` |
| L8 | logged in | pitcher set up, balance available ≥ required, pending cap not hit | OK | Pre-filled name/email (editable) + availability textarea + "Book meeting — uses $X.XX from your balance" → `POST /api/book-meeting-from-balance` |
| L9 | logged in | pitcher set up, 5 pending reservations | OK | "You have 5 pending pitches awaiting listener response. Cancel one from your [dashboard] before sending another." |

**Available balance** = `pitcher.credit_balance - pitcher.reservedBalance`. Required = `calculateTotalWithFee(listener.donation)`.

### 4.2 `/pitcher/{uid}` — visitor is a Listener, money source is page owner

| # | Auth | Visitor's listener profile | Pitcher doc gates | Render |
|---|---|---|---|---|
| P0 | — | — | missing | "Pitcher not found." |
| P1 | — | — | `isSetUp:false` OR `deletedAt` OR available-balance < required | Existing "not available" / "link inactive" messages |
| P2 | logged in | — | viewer.uid === pitcher.uid | Visitor view + same banner as L2; submit disabled |
| P3 | not logged in | n/a | OK | "Sign up as Listener to hear {name}'s pitch" → `/listener/signup?return=/pitcher/{uid}` + "Log in" |
| P4 | logged in | no listener doc (orphan) | OK | Auto-recover stubs, → P5 |
| P5 | logged in | listener stub | OK | "Finish your Listener profile" → `/listener/update-profile?return=/pitcher/{uid}` |
| P6 | logged in | listener soft-deleted | OK | "Your Listener profile was removed. Contact support." |
| P7 | logged in | listener set up | OK | Pre-filled name/email (editable) + availability + "Send meeting request" → `POST /api/request-meeting` (no balance touched) |

### 4.3 Meeting state machine (per meeting record)

```
Listener-page submission (visitor=pitcher):
  reserved ──listener accepts──> accepted        (balance committed)
           ──listener declines─> declined       (reservation released)
           ──14d expiry────────> expired        (reservation released)
           ──pitcher cancels───> cancelled      (reservation released, listener notified)

Pitcher-page submission (visitor=listener):
  pending  ──pitcher accepts──> accepted        (balance committed, can 409 on insufficient)
           ──pitcher declines─> declined
           ──14d expiry────────> expired
           ──listener cancels─> cancelled
```

Legacy `'pending'` meetings created before 0.8.0 are left in place untouched.

## 5. `?return=` query-param mechanism

### 5.1 Validation rules

A return path is accepted iff ALL of:
- non-empty
- ≤ 256 chars
- decode-able as URI component
- starts with `/`
- does NOT start with `//`
- does NOT contain `\`
- matches `^/(?:listener|pitcher)/[A-Za-z0-9_-]{1,128}(?:\?[A-Za-z0-9=&_-]*)?$`

Anything else → null → page falls back to its default destination.

### 5.2 Pages that honor `?return=`

| Page | Default destination | When to use return |
|---|---|---|
| `app/login/page.tsx` | `/choose-a-profile` | After successful email/password OR Google sign-in |
| `app/pitcher/signup/page.tsx` | `/pitcher/profile` | After signup + welcome email |
| `app/listener/signup/page.tsx` | `/listener/profile` | After signup + welcome email |
| `app/pitcher/update-profile/page.tsx` | `/pitcher/profile` | After save |
| `app/listener/update-profile/page.tsx` | `/listener/profile` | After save |
| `app/pitcher/add-fund/page.tsx` | `/pitcher/profile` | After PayPal capture success |

### 5.3 Google sign-in × `?return=`

When `return` is present and validates, login/signup **skip** `/choose-a-profile` and route directly to the return path. The next page (the public profile we returned to) determines what to render based on profile state — typically lands the user in L5/P5 to set up the role-relevant stub.

When `return` is absent, current behavior is preserved (route to `/choose-a-profile`).

### 5.4 Security threats handled

| Threat | Why allowlist neutralizes it |
|---|---|
| Open redirect to phishing | Only `/listener/{uid}` and `/pitcher/{uid}` accepted; arbitrary domains rejected at first char check |
| Protocol-relative redirect (`//evil.com`) | Explicit `startsWith('//')` reject |
| JS scheme (`javascript:...`) | Doesn't start with `/` |
| Backslash tricks (`/\evil.com`) | `\` is forbidden |
| Chained returns (`/login?return=//evil.com`) | `/login` is not on the allowlist regex |
| Encoding tricks | Decode first, then validate |
| Length-based DoS | 256 char cap |

## 6. Data model

### 6.1 New fields

| Collection | Field | Type | Default | Purpose |
|---|---|---|---|---|
| `pitchers` | `reservedBalance` | number | 0 | Sum of currently-`reserved` meeting amounts; `available = credit_balance - reservedBalance` |
| `meetings` | `paymentSource` | `'paypal-escrow'` \| `'pitcher-balance'` | n/a (required on new docs) | Distinguish legacy escrow from balance flow |
| `meetings` | `reservedAmount` | number | n/a | Snapshot of `calculateTotalWithFee(listener.donation)` at reservation time |
| `meetings` | `acceptTokenHash` | string | n/a | sha256 of HMAC token for email accept/decline |
| `meetings` | `tokenUsed` | boolean | false | One-time use enforcement |
| `meetings` | `reservedAt` | Timestamp | n/a | Drives 14-day expiry |
| `meetings` | `respondedAt` | Timestamp \| null | null | When accept/decline/cancel happened |
| `meetings` | `idempotencyKey` | string | n/a | Client-generated UUID, indexed unique-per-pitcher to dedupe |
| `meetings` | `cancelReason` | `'pitcher-cancel'` \| `'listener-cancel'` \| `'admin-soft-delete'` \| null | null | Audit |

### 6.2 New collection: none

All state fits in existing `pitchers` and `meetings`.

### 6.3 Status values

`meetings.status` extended with:
- `'reserved'` — pitcher booked on listener page; balance is reserved
- `'accepted'` — balance committed; donation logged
- `'declined'` — owner said no
- `'expired'` — 14 days passed without owner action
- `'cancelled'` — visitor withdrew (rare on listener-page side; possible on either)

Legacy `'pending'` retained for old docs and for `/pitcher/{uid}` request flow (pre-acceptance state when no balance is reserved).

### 6.4 `fund_history` entries

| `eventType` | When | Sign |
|---|---|---|
| `add_fund` | (existing) | positive (deposit) |
| `meeting_commit` | At accept of either flow | positive (a donation committed) |

We do NOT write fund_history on reservation; only on commit. Keeps the existing definition of "money that went somewhere" intact.

## 7. API endpoints

All token-authenticated endpoints use the new `lib/verifyUser.ts` helper.

### 7.1 `POST /api/book-meeting-from-balance`

Caller: signed-in pitcher on a listener's public page.
Auth: Firebase ID token via `Authorization: Bearer ...`.
Body: `{ listenerId: string; availability: string; idempotencyKey: string }`

Logic (Firestore transaction):
1. Verify token → `pitcherUid`.
2. Reject if `pitcherUid === listenerId` → 400 `cannot-book-self`.
3. Load `pitchers/{pitcherUid}` — reject 403 if missing/deleted/notSetUp.
4. Load `listeners/{listenerId}` — reject 404 if missing/deleted/notSetUp.
5. Check existing meeting with this `idempotencyKey` for this pitcher; if found → 200 with existing meeting id (idempotent replay).
6. Check pending-reservation count for this pitcher (`meetings where pitcherId == pitcherUid and status == 'reserved'`); if ≥ 5 → 429 `too-many-pending`.
7. Compute `reservedAmount = calculateTotalWithFee(listener.donation)`.
8. Reject if `pitcher.credit_balance - pitcher.reservedBalance < reservedAmount` → 409 `insufficient-balance`.
9. Generate token (raw + hash), expires in 14 days.
10. Atomically: create meeting doc + increment `pitchers/{pitcherUid}.reservedBalance` by `reservedAmount`.
11. Fire-and-forget: send listener notification email with Accept/Decline links carrying the raw token.

Response: `{ meetingId, reservedAmount, status: 'reserved' }`.

### 7.2 `POST /api/request-meeting`

Caller: signed-in listener on a pitcher's public page.
Body: `{ pitcherId: string; availability: string; idempotencyKey: string }`

Logic (transaction):
1. Verify token → `listenerUid`.
2. Reject `listenerUid === pitcherId` → 400.
3. Load both docs; standard rejections.
4. Idempotency check.
5. Verify pitcher's available-balance ≥ `calculateTotalWithFee(pitcher.donation)` at request time. If not → 409 `pitcher-link-inactive` (informational only; client should already gate this).
6. Generate token, hash.
7. Atomically: create meeting doc with `status: 'pending'`, `reservedAmount: snapshot(pitcher.donation × fee)`. **No balance change.**
8. Fire-and-forget: send pitcher notification email with Accept/Decline links.

Response: `{ meetingId, reservedAmount, status: 'pending' }`.

### 7.3 `GET /api/meeting/[id]/accept?token=X`

Caller: link click from email. No Firebase token required (the URL token IS the auth).

Logic (transaction):
1. Load meeting. 404 if missing.
2. If `status` not in `['reserved', 'pending']` → render terminal-state page (e.g. "Already accepted on {date}").
3. If `tokenUsed: true` → render "this link has been used."
4. Verify `sha256(rawToken) === acceptTokenHash`.
5. Verify meeting is within 14 days of `reservedAt`. If not → render expired page; also flip status to `expired` and release reservation.
6. Load pitcher doc; if soft-deleted → render "Pitcher is no longer available"; release reservation.
7. Atomically:
   - If `reserved` → commit: `credit_balance -= reservedAmount`, `reservedBalance -= reservedAmount`, `status: 'accepted'`, `tokenUsed: true`, `respondedAt: now`, write `fund_history` entry `meeting_commit`.
   - If `pending` → commit: check `credit_balance >= reservedAmount` (could have changed since request); if no → render "pitcher's balance is no longer sufficient"; if yes → `credit_balance -= reservedAmount`, `status: 'accepted'`, `tokenUsed: true`, `respondedAt: now`, write fund_history.
8. Render confirmation page with meeting details + Zoom link (current hardcoded one).
9. Fire-and-forget: send both parties a confirmation email.

### 7.4 `GET /api/meeting/[id]/decline?token=X`

Caller: link click from email.

Logic (transaction):
1. Load meeting. 404 if missing.
2. Terminal-state and token-used checks (same as accept).
3. Hash check.
4. If `reserved` → release: `reservedBalance -= reservedAmount`, `status: 'declined'`, `tokenUsed: true`, `respondedAt: now`.
5. If `pending` → `status: 'declined'`, `tokenUsed: true`, `respondedAt: now`. No balance change.
6. Render "request declined" page.
7. Fire-and-forget: send polite-decline notice to the visitor (pitcher in case 4, listener in case 5).

### 7.5 `POST /api/meeting/[id]/cancel`

Caller: signed-in user who submitted the meeting (the visitor side).
Auth: Firebase ID token.
Body: `{}` (meeting id in URL).

Logic:
1. Verify token → `userUid`.
2. Load meeting; reject if not in `['reserved', 'pending']`.
3. Verify `userUid` matches the *visitor* role for this meeting (`pitcherId` for reserved, `listenerId` for pending).
4. Atomically: release reservation if any, `status: 'cancelled'`, `cancelReason: '<role>-cancel'`, `respondedAt: now`, invalidate token (`tokenUsed: true` to break any pending email click).
5. Fire-and-forget: send polite "the {pitcher|listener} has withdrawn this request" email to the page-owner side.

### 7.6 Admin soft-delete hook (extension of existing route)

`DELETE /api/admin/[collection]/[id]` already does soft-delete. Extend it to sweep affected meetings:

For all meetings where `pitcherId == id` (when deleting pitcher) or `listenerId == id` (when deleting listener):
- If `status` in `['reserved', 'pending']`:
  - If `reserved`: decrement the pitcher's `reservedBalance`.
  - Set `status: 'cancelled'`, `cancelReason: 'admin-soft-delete'`, `respondedAt: now`, `tokenUsed: true`.
  - Fire-and-forget: send polite "this meeting has been cancelled" email to both parties.

## 8. Email templates

### 8.1 Reservation/request notification to page owner

Subject (listener-page case): "{pitcherName} wants to pitch to you on DonaTalk"
Subject (pitcher-page case): "{listenerName} wants to hear your pitch on DonaTalk"

Body includes:
- Visitor's name + the availability message
- The donation amount with note: "If you accept, **${reservedAmount}** will be committed."
- Two big buttons: `Accept` → `https://app.donatalk.com/api/meeting/{id}/accept?token=...` and `Decline` → same with `/decline`
- Note: "These links expire in 14 days."

### 8.2 Accept-confirmation email (to both parties)

Subject: "Meeting confirmed on DonaTalk"
Body: meeting details, the (currently hardcoded) Zoom link, the agreed donation amount.

### 8.3 Polite-decline email (to visitor)

Subject: "Update on your DonaTalk request"
Body: "Unfortunately {name} declined your meeting request. {if reserved case: 'Your ${amount} reservation has been released.'} You can browse other {pitchers|listeners} at https://donatalk.com"

### 8.4 Cancellation email (to page-owner when visitor cancels)

Subject: "A DonaTalk request was withdrawn"
Body: "The {pitcher|listener} who sent you a request has withdrawn it. No action needed on your part."

### 8.5 Admin-cancellation email (when soft-delete sweeps)

Subject: "Your DonaTalk meeting has been cancelled"
Body: brief notice, link to support.

## 9. Token security

- Secret: env var `MEETING_TOKEN_SECRET` (≥32 random bytes, base64). If unset, the booking endpoints **refuse to create reservations** with 500 — fail-loud rather than silently issue unverifiable tokens.
- Token format: base64url(crypto.randomBytes(32)). Server stores only `sha256(token)`.
- One-time use: server flips `tokenUsed:true` on first successful claim.
- Token never granted to the visitor side; only embedded in the page-owner notification email.
- Verification: constant-time compare of hashes.

## 10. Files to touch — phased

### Phase 1: `?return=` plumbing (this PR, no UX change)

| File | Change |
|---|---|
| `lib/safeReturn.ts` | NEW — `getSafeReturnPath(raw: string \| null): string \| null` |
| `lib/safeReturn.test.ts` | NEW — covers all 8 threat vectors + happy path |
| `app/login/page.tsx` | Read `?return=`; route there on success (email/pwd AND Google) |
| `app/pitcher/signup/page.tsx` | Same |
| `app/listener/signup/page.tsx` | Same |
| `app/pitcher/update-profile/page.tsx` | Same |
| `app/listener/update-profile/page.tsx` | Same |
| `app/pitcher/add-fund/page.tsx` | Same — destination after PayPal success |

Phase 1 is a no-op in current flows (no caller passes `?return=` yet).

### Phase 2: server endpoints + helpers (this PR, deployable dark)

| File | Change |
|---|---|
| `lib/verifyUser.ts` | NEW — like `verifyAdmin` but no email allowlist; returns `{ uid, email }` |
| `lib/verifyUser.test.ts` | NEW |
| `lib/meetingTokens.ts` | NEW — `generateToken()`, `hashToken(raw)`, `verifyToken(raw, hash)` |
| `lib/meetingTokens.test.ts` | NEW |
| `app/api/book-meeting-from-balance/route.ts` | NEW |
| `app/api/book-meeting-from-balance/route.test.ts` | NEW |
| `app/api/request-meeting/route.ts` | NEW |
| `app/api/request-meeting/route.test.ts` | NEW |
| `app/api/meeting/[id]/accept/route.ts` | NEW |
| `app/api/meeting/[id]/accept/route.test.ts` | NEW |
| `app/api/meeting/[id]/decline/route.ts` | NEW |
| `app/api/meeting/[id]/decline/route.test.ts` | NEW |
| `app/api/meeting/[id]/cancel/route.ts` | NEW |
| `app/api/meeting/[id]/cancel/route.test.ts` | NEW |
| `app/api/admin/[collection]/[id]/route.ts` | EDIT — sweep affected meetings on soft-delete |

### Phase 3: public page rewrites + dashboard inbox (separate PR)

| File | Change |
|---|---|
| `pages/listener/[uid].tsx` | Implement L0–L9 render branches |
| `pages/pitcher/[uid].tsx` | Implement P0–P7 render branches |
| `app/pitcher/profile/page.tsx` | Add "Available / Reserved / Total balance" rows + "Pending pitches" section with Cancel buttons; add "Incoming requests" section |
| `app/listener/profile/page.tsx` | Add "Incoming pitch requests" section with Accept/Decline buttons (in-app version of the email links) |
| Delete: `app/listener/arrange-meeting/page.tsx`, `app/api/escrow-log/route.ts`, `app/api/complete-order/route.ts` (replaced by `complete-order-and-update-fund` for add-fund; escrow path removed) |

Phase 3 is where users see the change and is browser-test-gated.

### Phase 4: release housekeeping

- Bump `package.json` to `0.8.0`
- Update `CHANGELOG.md` with feature description
- Update `docs/product-reference.md` + `docs/developer-reference.md` (version line + new API routes + new schema fields + user flow diagram)
- Update env-var list in `.ai-instructions.md` to include `MEETING_TOKEN_SECRET`

## 11. Acceptance scenarios (test criteria)

Scenarios verified by automated tests where possible; the rest are browser-test items for Phase 3.

| ID | Scenario | Test type |
|---|---|---|
| A1 | Brand new visitor on listener page hits L3 gate | Phase 3 browser |
| A2 | Logged-in pitcher with sufficient balance books — meeting created `reserved`, reservedBalance bumped, listener gets email | Phase 2 unit + Phase 3 browser |
| A3 | Listener clicks Accept in email — meeting `accepted`, balance committed, fund_history written | Phase 2 unit |
| A4 | Listener clicks Decline — meeting `declined`, reservedBalance released | Phase 2 unit |
| A5 | Listener clicks Accept twice — second click shows "already accepted" | Phase 2 unit |
| A6 | Double-submit from client with same idempotencyKey returns the same meeting id | Phase 2 unit |
| A7 | Pitcher books 5 reservations, 6th blocked with 429 | Phase 2 unit |
| A8 | Pitcher's profile soft-deleted mid-flight — listener accept rejects, reservation released | Phase 2 unit |
| A9 | Listener's profile soft-deleted mid-flight — admin sweep cancels meeting, pitcher emailed | Phase 2 unit |
| A10 | Open-redirect attempt `?return=//evil.com` → falls back to default | Phase 1 unit |
| A11 | Encoded redirect attempt `?return=%2F%2Fevil.com` → rejected after decode | Phase 1 unit |
| A12 | `?return=/listener/abc123` → accepted | Phase 1 unit |
| A13 | `?return=/admin` → rejected | Phase 1 unit |
| A14 | Token tampering rejected | Phase 2 unit |
| A15 | Self-visit to `/listener/{my-uid}` shows banner, server rejects booking with 400 | Phase 2 unit + Phase 3 browser |
| A16 | Listener-page submit when pitcher.uid === listener.uid → 400 | Phase 2 unit |
| A17 | Token created after `MEETING_TOKEN_SECRET` env-var change is unforgeable | Phase 2 unit |
| A18 | 14-day expiry — meeting accessed after `reservedAt + 14d` → flipped to `expired` + released | Phase 2 unit |

## 12. Decisions log

| Decision | Choice | Date |
|---|---|---|
| Force vs encourage sign-up | Force | 2026-05-19 |
| Anonymous PayPal escrow path | Removed | 2026-05-19 |
| Reservation timing | Only when pitcher (money source) acts | 2026-05-19 |
| Cap on pending reservations | 5 per pitcher; admin-configurable later | 2026-05-19 |
| Cancel flow notifies owner | Yes, politely | 2026-05-19 |
| Self-visit | Visitor view + banner, submit disabled | 2026-05-19 |
| Google sign-in with `?return=` | Skip `/choose-a-profile` only when return is present | 2026-05-19 |
| Refund/release mechanism | Two-phase commit + 14-day auto-expire + admin sweep on soft-delete | 2026-05-19 |
| Idempotency | Required (client UUID) | 2026-05-19 |
| Token security | HMAC + sha256 hash storage + one-time use | 2026-05-19 |
| Existing legacy `'pending'` meetings | Left untouched | 2026-05-19 |
| Amount snapshot label on accept page | "amount agreed at request time" | 2026-05-19 |

## 13. Open follow-ups (post-0.8.0)

- Targeted invite-by-email (pitcher invites a specific listener by email, link forces signup with email pre-filled, meeting binds on signup)
- Rate limiting on booking endpoints
- Replace hardcoded Zoom link with user-configurable meeting links
- Meeting completion / no-show tracking
- Actual donation-to-nonprofit transfer mechanism
- Vercel Cron for 14-day expiry sweep (v1 uses check-on-read)
- Recipient-side in-app Accept/Decline UI parity with email links
- Listener `reservedBalance` analogue if listener-side payments are ever introduced
