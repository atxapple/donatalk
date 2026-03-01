# DonaTalk Marketing Assets

> Version 1.0 | Created 2026-03-01

Marketing creative assets for DonaTalk's LinkedIn-first sales professional acquisition campaign.

## Directory Guide

| Directory | Contents |
|-----------|----------|
| `brand.css` | Shared brand tokens (colors, fonts, utility classes) |
| `linkedin/` | LinkedIn ad templates (carousel, lead gen, video storyboard) |
| `social/` | Organic social media post cards |
| `google/` | Google Display Network banner ads |
| `svg/` | Vector assets (logo, icons, badge) |
| `copy/` | Ad copy and outreach message templates |

## How to Use

### HTML Templates (LinkedIn, Social, Google)

1. Open any `.html` file in a browser
2. The template renders at exact ad dimensions (e.g., 1080x1080 for LinkedIn)
3. Screenshot the template at the rendered size
4. Upload the screenshot to your ad platform

**Tip:** Use browser DevTools → Device Mode to set exact viewport dimensions, then screenshot.

### SVG Assets

- Open in any vector editor (Figma, Illustrator, Inkscape)
- Scale to any size without quality loss
- `logo-full.svg` — full logo with wordmark
- `icon-heart-bubble.svg` — icon only
- `icons/` — supporting line-art icons
- `badge-founding-member.svg` — user achievement badge

### Ad Copy (Markdown)

- `linkedin-ads.md` — 3 ad variants + lead gen form copy + targeting
- `google-ads.md` — 3 ad groups + keywords + retargeting copy
- `outreach-messages.md` — Sales Navigator connection requests + follow-ups

## Brand Reference

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#EBE8E6` | Warm beige |
| Dark text | `#1D1F25` | Headlines, body |
| Pitcher CTA | `#C26148` | Terracotta buttons |
| Listener CTA | `#3498DB` | Blue buttons |
| Heart red | `#E74C3C` | Accents |
| Coral | `#F8A5A5` | Soft accents |
| Dark navy | `#2C3E50` | Dark backgrounds |
| Accent yellow | `#F1C40F` | Highlights |
| Font | Readex Pro | All marketing text |

## Asset List

### LinkedIn Carousel (5 slides, 1080x1080 each)
- `slide-1.html` — Hook: "What if every sales call also helped a non-profit?"
- `slide-2.html` — Problem: 1% cold email response rate
- `slide-3.html` — Solution: Donate to your prospect's cause
- `slide-4.html` — How It Works: 4-step flow
- `slide-5.html` — CTA: Join DonaTalk

### LinkedIn Lead Gen Ad (1200x628)
- `lead-gen-ad.html` — Split layout with headline + icons

### Video Storyboard
- `video-storyboard.html` — 6-panel production reference for 30s explainer

### Social Cards (1080x1080 each)
- `founder-story.html` — "Why I built DonaTalk"
- `how-it-works.html` — Pitcher → DonaTalk → Listener flow
- `cold-email-stat.html` — Big "1%" stat card
- `faq-card.html` — "Is DonaTalk right for you?"

### Google Display Banners
- `display-banner-728x90.html` — Leaderboard
- `display-banner-300x250.html` — Medium rectangle
- `display-banner-160x600.html` — Wide skyscraper
