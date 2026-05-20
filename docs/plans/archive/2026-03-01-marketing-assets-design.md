# DonaTalk Marketing Assets — Design Document

> Created: 2026-03-01 | Status: Approved | Version: 1.0

## Overview

Static marketing asset package (SVG + HTML/CSS + copy) for DonaTalk's LinkedIn-first acquisition strategy. Assets live in a standalone `marketing/` directory, separate from the Next.js app.

## Brand Reference (from donatalk.com)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#EBE8E6` | Page/card background |
| Dark text | `#1D1F25` | Headlines, body text |
| Pitcher CTA | `#C26148` (terracotta) | Pitcher actions, primary CTA |
| Listener CTA | `#3498DB` (blue) | Listener actions, secondary CTA |
| Heart red | `#E74C3C` | Accents, step numbers (from app) |
| Coral | `#F8A5A5` | Soft accents (from app) |
| Dark navy | `#2C3E50` | Alt dark backgrounds (from app) |
| Accent yellow | `#F1C40F` | Highlights (from app) |
| Font | Readex Pro, sans-serif | All marketing text |
| Logo | Speech bubble heart + "DonaTalk" wordmark | Top-left or centered |
| Hero illustration | Businessman with heart/donation icons | Reference style for illustrations |

**Existing assets to reference:**
- Hero: `https://donatalk.com/wp-content/uploads/2025/04/DonaTalk_Hero_300x222.png`
- Logo: `https://donatalk.com/wp-content/uploads/2025/04/logo-horizontal-with-text-2.png`
- Local icon: `public/DonaTalk_icon_88x77.png`
- Local logo: `public/logo horizontal with text.png`

**Copy voice:** Warm, professional, cause-driven. Dual CTA pattern ("I want to Pitch" / "I want to Listen").

## Directory Structure

```
marketing/
├── brand.css                        # Shared brand tokens, fonts, base styles
├── linkedin/
│   ├── carousel-sales-pitch/        # 5-slide carousel ad
│   │   ├── slide-1.html             # Hook
│   │   ├── slide-2.html             # Problem
│   │   ├── slide-3.html             # Solution
│   │   ├── slide-4.html             # How it works
│   │   └── slide-5.html             # CTA
│   ├── lead-gen-ad.html             # Single-image lead gen ad (1200x628)
│   └── video-storyboard.html        # 30s explainer storyboard
├── social/
│   ├── founder-story.html           # "Why I built DonaTalk" post card
│   ├── how-it-works.html            # Explainer card
│   ├── cold-email-stat.html         # Pain point stat card
│   └── faq-card.html                # FAQ card
├── google/
│   ├── display-banner-728x90.html   # Leaderboard
│   ├── display-banner-300x250.html  # Medium rectangle
│   └── display-banner-160x600.html  # Wide skyscraper
├── svg/
│   ├── logo-full.svg                # Full logo as SVG
│   ├── icon-heart-bubble.svg        # Icon-only version
│   ├── badge-founding-member.svg    # Founding Member badge
│   └── icons/
│       ├── handshake.svg
│       ├── donate.svg
│       └── calendar.svg
└── copy/
    ├── linkedin-ads.md              # LinkedIn ad copy (3 variants)
    ├── google-ads.md                 # Google search ad copy
    └── outreach-messages.md          # Sales Navigator DM templates
```

## Asset Specifications

### LinkedIn Carousel — "3 Reasons Your Next Sales Call Should Include a Donation"

**Format:** 5 slides, 1080x1080px each

| Slide | Headline | Visual |
|-------|----------|--------|
| 1 — Hook | "What if every sales call you made also helped a non-profit?" | Large text on dark navy (`#2C3E50`), DonaTalk logo, accent yellow underline |
| 2 — Problem | "Cold emails: 1% response rate. Gatekeepers. Zero trust." | Red stat numbers (`#E74C3C`), gray body, warm beige bg |
| 3 — Solution | "Commit to donate to your prospect's cause — they'll take your meeting." | Heart icon, coral accent bar, white/beige background |
| 4 — How It Works | "1. Sign up → 2. Add funds → 3. Share link → 4. Get meetings" | 4-step vertical flow, numbered circles in brand red |
| 5 — CTA | "Join DonaTalk — Turn cold outreach into warm introductions" | Terracotta CTA button, logo centered, `app.donatalk.com` |

### LinkedIn Lead Gen Ad

**Format:** 1200x628px single image

- Split layout: left side dark navy with headline text, right side warm beige with heart/handshake icon
- Headline: "Get Warm Sales Meetings by Giving Back"
- Sub: "Donate to your prospect's cause. They take your call."
- CTA: Terracotta button "Sign Up Free"
- Logo bottom-left

### Social Media Cards (1080x1080px each)

1. **Founder Story:** Dark navy background, large coral quote marks, white text "Why I built DonaTalk", logo bottom
2. **How It Works:** 3-panel horizontal flow (Pitcher → DonaTalk → Listener) with simple icons
3. **Cold Email Stat:** Big red "1%" centered, "That's the average cold email response rate" below, warm beige bg
4. **FAQ Card:** "Is DonaTalk right for me?" heading, 3 checkmark bullets, white/beige background

### Google Display Banners

All banners: dark navy (`#2C3E50`) background, white text, terracotta CTA button, DonaTalk logo.

| Size | Layout |
|------|--------|
| 728x90 (Leaderboard) | Logo left, tagline center, CTA right |
| 300x250 (Medium Rectangle) | Stacked: logo, headline, CTA |
| 160x600 (Skyscraper) | Vertical: logo, headline, 3 bullets, CTA |

### SVG Assets

- **logo-full.svg:** Recreate speech bubble heart + "DonaTalk" wordmark as vector
- **icon-heart-bubble.svg:** Icon-only speech bubble with heart
- **badge-founding-member.svg:** Shield/ribbon with star, "Founding Member" text
- **icons/:** Handshake, donate (dollar + heart), calendar — line-art style, stroke color `#2C3E50`

### Ad Copy (Markdown Files)

**LinkedIn Ads — 3 variants:**
- A: Problem-focused ("Tired of cold outreach?")
- B: Benefit-focused ("Get warm meetings by giving back")
- C: Curiosity ("What if your next sales call helped a non-profit?")

**Google Search Ads:** Headlines + descriptions for keywords: "warm introduction sales," "donate for meetings," "ethical sales outreach"

**Outreach Messages:** 3 connection request templates + 2 follow-up messages for Sales Navigator

## Technical Notes

- All HTML files are self-contained (inline CSS + embedded brand.css via `<link>`)
- Each HTML file sets exact pixel dimensions via CSS for screenshotting
- Google Fonts import for Readex Pro in brand.css
- SVGs use viewBox for scalability, no raster images embedded
- All assets reference brand.css for color/font consistency
