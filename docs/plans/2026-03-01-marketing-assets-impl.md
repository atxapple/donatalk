# Marketing Assets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a complete set of marketing assets (SVGs, HTML/CSS ad templates, ad copy) aligned with donatalk.com branding for DonaTalk's LinkedIn-first acquisition strategy.

**Architecture:** Static files in a `marketing/` directory at project root. A shared `brand.css` provides consistent colors, fonts, and base styles. HTML files are self-contained templates at exact ad dimensions for browser screenshotting. SVGs use viewBox for scalability.

**Tech Stack:** HTML5, CSS3, SVG, Google Fonts (Readex Pro), Markdown

---

### Task 1: Create brand.css foundation

**Files:**
- Create: `marketing/brand.css`

**Step 1: Create the marketing directory and brand.css**

```css
/* marketing/brand.css — DonaTalk Marketing Brand Tokens */
@import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap');

:root {
  /* Colors — from donatalk.com */
  --bg-warm: #EBE8E6;
  --text-dark: #1D1F25;
  --cta-pitcher: #C26148;
  --cta-listener: #3498DB;

  /* Colors — from app theme */
  --heart-red: #E74C3C;
  --coral: #F8A5A5;
  --navy: #2C3E50;
  --light: #ECF0F1;
  --accent-yellow: #F1C40F;
  --medium-gray: #95A5A6;
  --white: #FFFFFF;

  /* Typography */
  --font-family: 'Readex Pro', sans-serif;
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  color: var(--text-dark);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cta-button {
  display: inline-block;
  padding: 14px 32px;
  background: var(--cta-pitcher);
  color: var(--white);
  font-family: var(--font-family);
  font-weight: var(--font-semibold);
  font-size: 18px;
  text-decoration: none;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.cta-button--listener {
  background: var(--cta-listener);
}

.logo-text {
  font-family: var(--font-family);
  font-weight: var(--font-bold);
}

.logo-text .dona {
  color: var(--navy);
}

.logo-text .talk {
  color: var(--heart-red);
}
```

**Step 2: Verify the file exists**

Run: `ls marketing/brand.css`
Expected: file listed

**Step 3: Commit**

```bash
git add marketing/brand.css
git commit -m "feat(marketing): add brand.css with DonaTalk brand tokens"
```

---

### Task 2: Create SVG assets — logo and icon

**Files:**
- Create: `marketing/svg/logo-full.svg`
- Create: `marketing/svg/icon-heart-bubble.svg`

**Step 1: Create logo-full.svg**

Recreate the DonaTalk logo as SVG: peach/orange speech bubble with heart + "DonaTalk" wordmark. Reference `public/logo horizontal with text.png` for proportions. The speech bubble is rounded rectangle with a tail at bottom-left, containing an orange heart. "Dona" in navy (#2C3E50), "Talk" in red (#E74C3C).

**Step 2: Create icon-heart-bubble.svg**

Icon-only version: just the speech bubble with heart, no text. Should work at 48x48 and scale up.

**Step 3: Verify SVGs render**

Open each SVG in a browser to verify they render correctly.

**Step 4: Commit**

```bash
git add marketing/svg/logo-full.svg marketing/svg/icon-heart-bubble.svg
git commit -m "feat(marketing): add DonaTalk logo and icon SVGs"
```

---

### Task 3: Create SVG assets — supporting icons

**Files:**
- Create: `marketing/svg/icons/handshake.svg`
- Create: `marketing/svg/icons/donate.svg`
- Create: `marketing/svg/icons/calendar.svg`

**Step 1: Create handshake.svg**

Line-art handshake icon. Stroke color `#2C3E50`, stroke-width 2, no fill. viewBox="0 0 48 48". Two hands meeting in a handshake gesture.

**Step 2: Create donate.svg**

Dollar sign inside a heart shape. Stroke color `#2C3E50`, stroke-width 2. viewBox="0 0 48 48".

**Step 3: Create calendar.svg**

Simple calendar icon with a clock overlay. Stroke color `#2C3E50`, stroke-width 2. viewBox="0 0 48 48".

**Step 4: Verify all icons render**

Open each SVG in browser.

**Step 5: Commit**

```bash
git add marketing/svg/icons/
git commit -m "feat(marketing): add supporting icon SVGs (handshake, donate, calendar)"
```

---

### Task 4: Create SVG — Founding Member badge

**Files:**
- Create: `marketing/svg/badge-founding-member.svg`

**Step 1: Create badge SVG**

Shield/ribbon shape with a star at top. Text "FOUNDING MEMBER" in the center. Colors: navy shield (#2C3E50), accent yellow star (#F1C40F), white text. viewBox="0 0 200 240".

**Step 2: Verify in browser**

**Step 3: Commit**

```bash
git add marketing/svg/badge-founding-member.svg
git commit -m "feat(marketing): add Founding Member badge SVG"
```

---

### Task 5: Create LinkedIn carousel — slides 1-3

**Files:**
- Create: `marketing/linkedin/carousel-sales-pitch/slide-1.html`
- Create: `marketing/linkedin/carousel-sales-pitch/slide-2.html`
- Create: `marketing/linkedin/carousel-sales-pitch/slide-3.html`

Each slide is a self-contained HTML file, 1080x1080px, linking to `../../brand.css`.

**Step 1: Create slide-1.html (Hook)**

- Background: dark navy (`#2C3E50`)
- Large white text: "What if every sales call you made also helped a non-profit?"
- Accent yellow underline beneath key phrase
- DonaTalk logo (inline SVG or reference `../svg/logo-full.svg`) bottom-right
- Fixed size: `width: 1080px; height: 1080px;`

**Step 2: Create slide-2.html (Problem)**

- Background: warm beige (`#EBE8E6`)
- Large red number: "1%" with subtitle "average cold email response rate"
- Three pain points listed: "Gatekeepers block you", "Prospects don't trust you", "No reason to say yes"
- Dark text, red accent numbers

**Step 3: Create slide-3.html (Solution)**

- Background: white/warm beige
- Headline: "Commit to donate to your prospect's cause"
- Sub: "They'll gladly take your meeting."
- Coral (#F8A5A5) accent bar on left side
- Heart-bubble icon centered

**Step 4: Open each slide in browser, verify 1080x1080 rendering**

**Step 5: Commit**

```bash
git add marketing/linkedin/carousel-sales-pitch/slide-1.html marketing/linkedin/carousel-sales-pitch/slide-2.html marketing/linkedin/carousel-sales-pitch/slide-3.html
git commit -m "feat(marketing): add LinkedIn carousel slides 1-3 (hook, problem, solution)"
```

---

### Task 6: Create LinkedIn carousel — slides 4-5

**Files:**
- Create: `marketing/linkedin/carousel-sales-pitch/slide-4.html`
- Create: `marketing/linkedin/carousel-sales-pitch/slide-5.html`

**Step 1: Create slide-4.html (How It Works)**

- Background: white
- Title: "How It Works"
- 4-step vertical flow with numbered circles (heart-red background, white numbers):
  1. Sign up as a Pitcher
  2. Add funds for donation
  3. Share your unique link
  4. Get warm meetings
- Connecting vertical line between steps

**Step 2: Create slide-5.html (CTA)**

- Background: dark navy (`#2C3E50`)
- DonaTalk logo centered top
- Headline: "Turn cold outreach into warm introductions"
- Terracotta CTA button: "Join DonaTalk Free"
- URL: `app.donatalk.com` below button
- Tagline at bottom: "Share your cause and connect with supporters"

**Step 3: Verify in browser**

**Step 4: Commit**

```bash
git add marketing/linkedin/carousel-sales-pitch/slide-4.html marketing/linkedin/carousel-sales-pitch/slide-5.html
git commit -m "feat(marketing): add LinkedIn carousel slides 4-5 (how it works, CTA)"
```

---

### Task 7: Create LinkedIn lead gen ad

**Files:**
- Create: `marketing/linkedin/lead-gen-ad.html`

**Step 1: Create lead-gen-ad.html**

- Fixed size: `width: 1200px; height: 628px`
- Split layout: left 60% dark navy, right 40% warm beige
- Left side: headline "Get Warm Sales Meetings by Giving Back" in white, sub "Donate to your prospect's cause. They take your call." in light gray
- Right side: heart-bubble icon (large, centered), handshake icon below
- Terracotta CTA button "Sign Up Free" at bottom-left
- DonaTalk logo bottom-left corner

**Step 2: Verify in browser at 1200x628**

**Step 3: Commit**

```bash
git add marketing/linkedin/lead-gen-ad.html
git commit -m "feat(marketing): add LinkedIn lead gen ad template (1200x628)"
```

---

### Task 8: Create LinkedIn video storyboard

**Files:**
- Create: `marketing/linkedin/video-storyboard.html`

**Step 1: Create video-storyboard.html**

A visual storyboard layout (not a video) — 6 panels in a 2x3 grid showing the 30-second explainer:

| Panel | Time | Visual | Script |
|-------|------|--------|--------|
| 1 | 0-5s | Sales rep frustrated at desk | "Tired of cold emails getting ignored?" |
| 2 | 5-10s | DonaTalk logo reveal | "Meet DonaTalk." |
| 3 | 10-15s | Pitcher signs up, gets link | "Sign up and get your unique pitch link." |
| 4 | 15-20s | Link shared, donation committed | "Commit to donate to your prospect's cause." |
| 5 | 20-25s | Prospect accepts meeting | "They'll gladly take your call." |
| 6 | 25-30s | Both smiling, non-profit logo | "Warm meetings. Real donations. app.donatalk.com" |

Each panel is a card with a placeholder illustration area, timestamp, and script text below.

**Step 2: Verify in browser**

**Step 3: Commit**

```bash
git add marketing/linkedin/video-storyboard.html
git commit -m "feat(marketing): add LinkedIn video ad storyboard template"
```

---

### Task 9: Create social media cards (4 cards)

**Files:**
- Create: `marketing/social/founder-story.html`
- Create: `marketing/social/how-it-works.html`
- Create: `marketing/social/cold-email-stat.html`
- Create: `marketing/social/faq-card.html`

All cards are 1080x1080px.

**Step 1: Create founder-story.html**

- Dark navy background
- Large coral (#F8A5A5) opening quote mark top-left (decorative, ~120px)
- White text: "Why I built DonaTalk"
- Body (lighter gray): "I watched sales reps struggle with cold outreach every day. What if every pitch also helped a non-profit? That question became DonaTalk."
- DonaTalk logo bottom-center in white variant

**Step 2: Create how-it-works.html**

- White/warm beige background
- Title: "How DonaTalk Works"
- 3-panel horizontal flow with icons:
  - Panel 1: Person icon + "Pitcher signs up & adds funds"
  - Arrow →
  - Panel 2: Heart-bubble icon + "DonaTalk connects"
  - Arrow →
  - Panel 3: Person icon + "Listener gets donation to their cause"
- DonaTalk logo bottom-center

**Step 3: Create cold-email-stat.html**

- Warm beige background
- Massive centered red (#E74C3C) text: "1%"
- Below: "That's the average cold email response rate."
- Below: "DonaTalk gives prospects a reason to say yes."
- Terracotta CTA: "Learn more at donatalk.com"

**Step 4: Create faq-card.html**

- White background with subtle warm beige border
- Heading: "Is DonaTalk right for you?"
- 3 checkmark items (heart-red checkmarks):
  - "You're in sales and tired of cold outreach"
  - "You believe in supporting non-profits"
  - "You want warm introductions, not cold calls"
- CTA: "Sign up free at app.donatalk.com"

**Step 5: Open all 4 cards in browser, verify 1080x1080 rendering**

**Step 6: Commit**

```bash
git add marketing/social/
git commit -m "feat(marketing): add 4 social media card templates (1080x1080)"
```

---

### Task 10: Create Google display banners

**Files:**
- Create: `marketing/google/display-banner-728x90.html`
- Create: `marketing/google/display-banner-300x250.html`
- Create: `marketing/google/display-banner-160x600.html`

All banners: dark navy (#2C3E50) background, white text, terracotta CTA, DonaTalk logo.

**Step 1: Create display-banner-728x90.html (Leaderboard)**

- Fixed: `width: 728px; height: 90px`
- Layout: logo (left, small) | tagline "Turn cold outreach into warm introductions" (center) | CTA button "Sign Up" (right)
- 1px border `#3498DB` for ad boundary

**Step 2: Create display-banner-300x250.html (Medium Rectangle)**

- Fixed: `width: 300px; height: 250px`
- Stacked layout:
  - DonaTalk logo (top center)
  - Headline: "Get Warm Meetings by Giving Back"
  - Sub: "Donate to your prospect's cause."
  - CTA button: "Sign Up Free" (bottom center)

**Step 3: Create display-banner-160x600.html (Wide Skyscraper)**

- Fixed: `width: 160px; height: 600px`
- Vertical layout:
  - Logo (top)
  - Headline: "Warm Meetings Through Giving"
  - 3 bullets: "Sign up", "Add funds", "Get meetings"
  - CTA button: "Join Free" (bottom)

**Step 4: Open all 3 banners in browser, verify exact dimensions**

**Step 5: Commit**

```bash
git add marketing/google/
git commit -m "feat(marketing): add Google display banner templates (728x90, 300x250, 160x600)"
```

---

### Task 11: Write LinkedIn ad copy

**Files:**
- Create: `marketing/copy/linkedin-ads.md`

**Step 1: Write the copy document**

Include 3 complete variants, each with: headline (under 70 chars), body (under 150 chars for sponsored content), and CTA text.

**Variant A — Problem-focused:**
- Headline: "Tired of Cold Emails Getting Ignored?"
- Body: "Sales reps using DonaTalk get warm meetings by committing to donate to their prospect's cause. Stop cold calling. Start giving back."
- CTA: "Sign Up as a Pitcher"

**Variant B — Benefit-focused:**
- Headline: "Get Warm Sales Meetings by Giving Back"
- Body: "What if your prospect had a reason to say yes? DonaTalk turns your sales outreach into charitable donations. Everyone wins."
- CTA: "Join DonaTalk Free"

**Variant C — Curiosity:**
- Headline: "What If Your Next Sales Call Helped a Non-Profit?"
- Body: "DonaTalk connects sales professionals with supporters through charitable giving. Commit to donate, get the meeting."
- CTA: "Learn How It Works"

Also include lead gen form ad copy (headline + description for LinkedIn Lead Gen Forms).

**Step 2: Commit**

```bash
git add marketing/copy/linkedin-ads.md
git commit -m "feat(marketing): add LinkedIn ad copy (3 variants + lead gen)"
```

---

### Task 12: Write Google search ad copy

**Files:**
- Create: `marketing/copy/google-ads.md`

**Step 1: Write the copy document**

Include 3 responsive search ad groups targeting different keyword clusters:

**Ad Group 1 — "warm introductions":**
- Headlines (30 chars max each): "Warm Sales Introductions", "Stop Cold Calling Today", "Donate & Get Meetings"
- Descriptions (90 chars max each): "Turn cold outreach into warm meetings by donating to your prospect's cause. Sign up free."

**Ad Group 2 — "ethical sales":**
- Headlines: "Ethical Sales Outreach", "Sales Meets Charity", "Give Back, Get Meetings"
- Descriptions: "DonaTalk lets sales pros earn meetings by supporting non-profits. A better way to sell."

**Ad Group 3 — "meeting scheduling":**
- Headlines: "Get More Sales Meetings", "Meetings Through Giving", "Prospects Say Yes"
- Descriptions: "Give your prospects a reason to take your call. Commit to donate to their cause on DonaTalk."

Include negative keywords list and retargeting display ad copy.

**Step 2: Commit**

```bash
git add marketing/copy/google-ads.md
git commit -m "feat(marketing): add Google search ad copy (3 ad groups + retargeting)"
```

---

### Task 13: Write Sales Navigator outreach messages

**Files:**
- Create: `marketing/copy/outreach-messages.md`

**Step 1: Write the templates**

**Connection Request Templates (300 char limit):**

Template 1 (Direct): "Hi [Name], I'm building DonaTalk — a platform where sales pros earn meetings by donating to non-profits. As a [title] at [company], you'd be a great fit. Would love to connect."

Template 2 (Curiosity): "Hi [Name], what if every sales call you made also helped a charity? I'd love to share how DonaTalk is changing B2B outreach."

Template 3 (Value): "Hi [Name], noticed you're in [industry] sales. DonaTalk helps reps like you get warm intros by supporting causes prospects care about. Happy to share more."

**Follow-up Messages (2):**

Follow-up 1 (3 days after connect): Share a brief use case and link to sign up.

Follow-up 2 (7 days, final): Offer to walk them through the platform, soft CTA.

**Step 2: Commit**

```bash
git add marketing/copy/outreach-messages.md
git commit -m "feat(marketing): add Sales Navigator outreach message templates"
```

---

### Task 14: Visual review of all assets

**Step 1: Open all HTML assets in browser**

Open each HTML file and verify:
- Correct dimensions render
- Fonts load (Readex Pro via Google Fonts)
- Colors match brand tokens
- Logos and icons display properly
- Text is readable and well-spaced

**Step 2: Fix any visual issues**

Adjust CSS as needed for spacing, font sizes, alignment.

**Step 3: Commit any fixes**

```bash
git add marketing/
git commit -m "fix(marketing): polish visual issues across all marketing assets"
```

---

### Task 15: Final commit and summary

**Step 1: Verify all files are committed**

Run: `git status`
Expected: clean working directory

**Step 2: Review the full asset list**

Run: `find marketing/ -type f | sort`
Expected: ~25 files across all directories

**Step 3: Add a README for the marketing directory**

Create `marketing/README.md` with:
- What each directory contains
- How to use the assets (open HTML in browser, screenshot)
- Brand reference quick links

**Step 4: Commit**

```bash
git add marketing/README.md
git commit -m "docs(marketing): add README for marketing assets directory"
```
