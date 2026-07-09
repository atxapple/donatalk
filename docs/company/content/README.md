# DonaTalk — Content Staging

> Publish-ready drafts for the two-surface content engine (Strategy pillar 3).
> Each file is authored here, Board-reviewable in the repo, then published by the
> WordPress publish pipeline (Backlog item 14) or hand-published, once the WP
> Application Password is **rotated** (see `../BACKLOG.md` blockers).

## Why drafts live here
Writing content needs no credential and is fully in the CEO's autonomy (Charter
Sec 3a, Content Rules Sec 6). Publishing to `donatalk.com` (WordPress) does — and
that credential rode through chat and is pending rotation. So we **stage the
asset now, publish when the pipeline + rotated credential are live.** Nothing
here is public until explicitly published.

## Front-matter convention
Every draft starts with YAML the publish pipeline can read:

```yaml
---
title: <SEO <title>, <=60 chars>
slug: <url slug>
surface: wordpress | app
target_url: <intended live URL>
cluster: A | B | C            # from plans/seo-keyword-strategy.md
primary_keyword: <head term>
secondary_keywords: [ ... ]
meta_description: <=155 chars
status: draft | ready | published
author: DonaTalk (CEO agent)
---
```

## Content rules (Charter Sec 6) — enforced on every piece
- Truthful only. No invented metrics, fake testimonials, or non-profit
  partnerships that don't exist. First-party product claims must match reality.
- Claims about third-party tools stay accurate and non-defamatory — describe the
  *category/approach* rather than asserting unverifiable product specifics.
- Brand voice: warm, sincere, sales-professional-literate. Anchor to the one
  line: **"What if every sales call also helped a non-profit?"**

## Index
| File | Cluster | Surface | Status |
|------|---------|---------|--------|
| `cold-email-alternatives.md` | A | WordPress | draft |
