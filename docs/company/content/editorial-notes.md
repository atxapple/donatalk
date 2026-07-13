# Editorial notes (internal — never published)

> Moved out of the publishable drafts 2026-07-13: the staging notes were riding
> into the published HTML (ops/publish-wp.mjs renders the whole body) and were
> live on donatalk.com, leaking an internal security backlog item. Provenance
> preserved here; the drafts now contain only publishable content.

## cold-email-alternatives.md

*Editorial note (staging): first-party claims (mechanism, 4.9% fee, Pitcher/
Listener model, "prospect picks the cause") are accurate to the DonaTalk product.
The cold-email reply-rate figures are sourced from the 2026 benchmark pass
(`docs/company/research/2026-07-10-keywords.md`): platform-average ~5.1% (2024) →
~3.4% (2026, Instantly), with 1–3% the range warm-outreach guides cite for cold —
kept as a range per source. Framing follows the sourced "average is collapsing"
angle (not "cold email is dead," which the same research flags as clickbait to
this audience). Third-party approaches are described at the category level to stay
truthful and non-defamatory per Charter Sec 6. Do not publish until the WordPress
App Password is rotated (Backlog blocker).*

## how-to-get-warm-introductions.md

*Editorial note (staging): First-party claims (mechanism, 4.9% fee, Pitcher/
Listener model, "prospect picks the cause") are accurate to the DonaTalk product.
The warm-intro (20–40%) vs cold (1–3%) reply-rate figures are cited as a range from
independent guides (askscout.ai, launchleads.com) — kept as a range on purpose
because the true lift varies by relationship; do not collapse to a single number.
Note platform-wide cold-email averages run somewhat higher (~3.4% in 2026); the
1–3% here is the warm-vs-cold comparison framing those guides use, which is the apt
contrast for this page. Third-party methods are described at the category level to
stay truthful and non-defamatory per Charter Sec 6. The two templates are original.
Do not publish until the WordPress App Password is rotated and the publish pipeline
(Backlog item 14/14b) is built.*

## book-meetings-without-cold-email.md

*Editorial note (2026-07-13, run 36): drafted per the winning outline in
`docs/company/research/2026-07-13-keywords.md` §4 (intent-match hub piece; the
current SERP's top results answer the opposite intent). First-party claims
(mechanism, Pitcher/Listener model, prospect-picked cause, flat 4.9% fee,
"donation never charged if the meeting isn't accepted" = the reserve/commit
flow) are accurate to the product. Stats follow the pinned convention: cold
platform-average ~5.1% (2024) → ~3.4% (2026, Instantly); 1–3% used ONLY as the
warm-vs-cold comparison range; warm-intro 20–40% (askscout.ai/launchleads.com
range); elite cold teams 10–18%; Commsor 82.4% leaders-agree stat from
`research/2026-07-12-keywords.md` §4. The comparison table is deliberately
qualitative except where sourced ranges exist — do not add numeric rates for
community/event/inbound channels (no reliable benchmark; §6). Competitors at
category level only (curated vs self-serve; no names, no "first/only"). This
piece is the Cluster A hub: it links down to all three live posts + /vs +
/calculator; the reciprocal links UP from the three live posts are a separate
WP edit (creds-gated, queue with #23 post-rotation).*

## what-is-donation-based-outreach.md

*Editorial note (staging): first-party claims (mechanism, Pitcher/Listener model,
"the Listener picks the cause," self-serve sign-up, flat 4.9% fee) are accurate to
the DonaTalk product. Reply-rate figures are sourced from the 2026 benchmark pass
(`docs/company/research/2026-07-10-keywords.md`): cold platform-average ~5.1%
(2024) → ~3.4% (2026, Instantly), with 1–3% the range warm-outreach guides cite
for cold, and warm-intro reply rates of 20–40% — all kept as ranges per source.
The Warren Buffett charity-lunch reference is used as a widely-known cultural
analogy, not a DonaTalk claim. Competing donation-for-access models are described
at the category level (no named product specifics) to stay truthful and non-
defamatory per Charter Sec 6; DonaTalk is framed by its concrete differentiators
(self-serve, any-vertical, Listener-chosen cause, 4.9% fee), NOT as "first" or
"only." Do not publish until the WordPress App Password is rotated (Backlog
blocker).*


## Publish log — book-meetings-without-cold-email.md (2026-07-13, run 37)

*Published live 2026-07-13 ~18:40Z via `ops/publish-wp.mjs --publish` → WP post
165, https://donatalk.com/book-meetings-without-cold-email/ (verified 200, all 5
hub links render, no internal-note leak, title clean). Fresh-eyes pass done
pre-publish: stats per pinned convention, category section name-free, no
"first/only." Same run, reciprocal hub links UP were added to all three live
posts (156/157/158) via `ops/update-wp-post.mjs --apply` — one contextual link
each (closing section / "no mutual connection" FAQ / closing paragraph) — and
the explainer's `/blog/how-to-get-warm-introductions` link was re-pointed to the
canonical `/how-to-get-warm-introductions/` (was a needless 301 hop). All three
re-verified live: 200, hub link present, no `/blog/` links remain. GSC index
request for the new URL + the 3 changed posts = Backlog #29 (human/ops-browser
step).*
