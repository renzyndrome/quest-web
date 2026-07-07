# Handoff: Quest Laguna Church Website

## Overview
A multi-page church website for Quest Laguna, a promise-driven church with nine
locations across Laguna, Philippines. The site covers: church profile (home),
sermon/service video archive with YouTube embeds, news & announcements,
ministries, giving, and a connect page with a working prayer-request form.

Tone requirement from the client: **formal, modern, warm, and human — NOT
marketing/corporate.** No stats bands, no salesy copy, no em-dashes in body
text. Short plain sentences. Filipino code-switching (e.g. "Isang dekada ng
katapatan") is on-brand and intentional — do not "fix" it.

## About the Design Files
The files in this bundle are **design references created in HTML** (Design
Component `.dc.html` format). They are prototypes showing intended look and
behavior, **not production code to copy directly**. The task is to recreate
these designs in the target codebase's environment (Next.js, Astro, plain
React, WordPress theme, etc.) using its established patterns. If no
environment exists yet, a static-first framework (Astro or Next.js) is a good
fit: the site is content-heavy, mostly static, with light interactivity.

How to read the `.dc.html` files: the markup between `<x-dc>` and `</x-dc>` is
the page template (all styles inline). The `<script data-dc-script>` block at
the bottom holds a `Component` class whose `renderVals()` supplies dynamic
values referenced as `{{ name }}` in the template. Treat `{{ }}` as
React-style data binding.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final unless
noted as placeholder. Recreate pixel-perfectly.

Known placeholders (client to supply):
- GCash number + bank details on Give page (marked with dashed-border boxes)
- Real per-service video links on Sermons page (currently all embeds point at
  the channel uploads playlist)
- All `<image-slot>` elements are drag-and-drop photo placeholders — replace
  with real `<img>` photos in production (the `placeholder` attribute
  describes the intended photo)
- News page announcement entries are sample content

## Pages

### 1. Home (`ChurchWebsite.dc.html`)
- **Header** (shared, `SiteHeader.dc.html`): fixed, 76px tall, white at 96%
  opacity, bottom border rgba(20,19,21,.08). Logo mark (round PNG) + "Quest /
  LAGUNA" wordmark. Nav: Home, Sermons, Ministries, News, Give, Connect.
  Nav links: Manrope 600 14px, rgba(20,19,21,.65), hover #141315.
- **Hero**: cream gradient (#FBF5E9 → #ffffff), centered. Eyebrow with red
  ››› chevrons + "A CHURCH IN LAGUNA, PHILIPPINES" (Manrope 700 12px,
  letter-spacing .2em, uppercase, #8E0E1E). H1 "Welcome home." Poppins 600
  60px/1.12, #141315. Body paragraph Manrope 400 18px/1.7 rgba(20,19,21,.66).
  Primary CTA red pill (#D81E2F, hover #B81529, radius 999, padding 16x30,
  Manrope 600 15px white). Secondary: underlined text link #8E0E1E.
  Below CTAs: 3-photo collage grid (1fr 1.6fr 1fr, gap 16, heights
  230/300/230px, radius 16, bottom-aligned).
- **Events carousel**: max-width 1080, radius 20, shadow 0 16px 44px
  rgba(0,0,0,.12). Track is a flex row, each slide flex:0 0 100%, min-height
  300px; slides move via transform:translateX(-N*100%) with 600ms
  cubic-bezier(.4,0,.2,1). Auto-advance every 5000ms; pause on hover
  (mouseenter clears interval, mouseleave restarts); manual dot click resets
  the timer; **disabled entirely under prefers-reduced-motion**. Dots:
  active = 26x8 white pill, inactive = 8px 45%-white circle, absolute
  bottom 20px centered. 4 slides:
  1. NEXTLEVEL Stronger (gradient 120deg #8E0E1E→#D81E2F, campaign banner
     image right, 300px wide, radius 14)
  2. Quest Retreat (bg #141315, red date chip)
  3. Water baptism (bg #FBF5E9, maroon date chip)
  4. Combined worship (gradient 120deg #2E0408→#8E0E1E, translucent chip)
  Below: right-aligned link "All news and announcements" → News page.
- **About**: 2-col intro (1fr 1.2fr, gap 72): eyebrow "Who we are", H2
  Poppins 600 40px/1.18. Then 3 cards (#FBF5E9, radius 18, padding 36x32),
  each: photo slot 170px radius 12, red 34x3px rule, title Poppins 600 21px,
  body Manrope 400 15px/1.7. Cards: Worship / Community / Growth.
- **Journey**: accordion of 3 numbered stages (New Friends, Schooling,
  Leader) — white cards radius 18, shadow 0 10px 28px rgba(0,0,0,.06);
  header row: Anton-style number in #D81E2F (38px), Oswald/Poppins title,
  +/– indicator; expands to a 2-col grid of step chips (#FBF5E9 boxes,
  radius 10, red 8px dot). NOTE: client asked internal jargon (SOD etc.) be
  minimized on public site — keep this section high-level.
- **Locations**: 2-col (1fr 1.25fr, gap 64). Left: selected-location card
  (#FBF5E9 radius 18) with red map-pin disc (44px), name Poppins 600 24px,
  area #8E0E1E, note, photo slot 180px. Right: 3-col grid of 9 location
  buttons; active = #FDE4E7 bg + rgba(216,30,47,.55) border, inactive =
  white + rgba(20,19,21,.1) border, hover border rgba(216,30,47,.5).
  Clicking a tile selects it (state).
- **Visit**: cream section, centered. H2 "Come as you are." 4 service cards
  (white, border rgba(20,19,21,.06), radius 18, padding 30x26):
  - Sunday Family Service — Sundays · 10:00 AM — "Our main service, for the whole family."
  - Young Pro — Fridays · 7:00 PM — "For young professionals."
  - Youth Service — Saturdays · 3:00 PM — "For students and young people."
  - Dawn — Saturdays · 5:00 AM — "Early morning prayer and worship."
  Card pattern: day/time eyebrow (Manrope 700 12px uppercase .12em #8E0E1E),
  name Poppins 600 19px, one-line description. Below: location note + CTAs
  ("Message us on Facebook" red pill → facebook.com/questlaguna).
- **More from Quest**: 3 link cards (#FBF5E9 radius 18) → Sermons, News, Connect.
- **Footer** (shared, `SiteFooter.dc.html`): #141315, 4-col grid
  (1.4fr 1fr 1fr 1fr): logo + mission + FB link; two location columns
  (9 locations); Explore column (Home, Sermons, Ministries, News, Give,
  Connect). Bottom bar: copyright + scripture line, border-top
  rgba(255,255,255,.1).

### 2. Sermons (`Sermons.dc.html`)
- Hero: same cream-gradient page-hero pattern (eyebrow "Watch again", H1
  Poppins 600 48px).
- Featured player: 16:9 (padding-top 56.25% trick), radius 18, shadow, iframe
  `https://www.youtube.com/embed/videoseries?list=UUqyGbGmIG_CmocMrAnrufsA`
  (channel uploads playlist = always the latest). "View channel" outline pill →
  `https://www.youtube.com/channel/UCqyGbGmIG_CmocMrAnrufsA`.
- Our services: 4 clickable service cards (same content as Visit section);
  clicking filters the archive & smooth-scrolls to it.
- Archive: filter tabs (All + 4 services) — active tab red pill, inactive
  white pill with border. 3-col grid of video cards: 16:9 embed, service
  badge (#FDE4E7 bg, #8E0E1E text, pill, uppercase 10px), title Poppins 600
  16px, date Manrope 400 13px. Data-driven from an array {service, title,
  date, videoId}. In production: fetch via YouTube Data API or maintain
  per-service playlists.
- Footer CTA: "Browse the full archive on YouTube" red pill + Facebook live note.

### 3. News (`News.dc.html`)
- Hero: eyebrow "What's happening", H1 "News & announcements".
- Pinned card: #FBF5E9, border rgba(142,14,30,.15), radius 18. Red "Pinned"
  pill + date/scope; banner photo slot 220px; title Poppins 600 26px; body.
- Announcement list rows: 64px date block (#FBF5E9, radius 12, day Poppins
  600 22px + month uppercase #8E0E1E) + category chip (outlined maroon pill,
  10px uppercase) + title Poppins 600 20px + body Manrope 15px/1.65.
  Rows divided by rgba(20,19,21,.08) borders.

### 4. Ministries (`Ministries.dc.html`)
- Hero: eyebrow "Ministries", H1 "Whatever you're good at, God can use it."
  + encouragement paragraph + ScriptureLine (1 Peter 4:10). 3-photo strip
  (1.4fr 1fr 1fr, 260px, radius 16).
- 6 area cards in 2-col grid (#FBF5E9 radius 18 padding 34x32): Worship &
  Creative, Teaching & Discipleship, Kids & Next Generation, Prayer &
  Fellowship, Service & Operations, Outreach & Missions. Each: red rule,
  title Poppins 600 21px, one-paragraph invitation, team chips (white pills,
  border rgba(20,19,21,.1), Manrope 600 12px #3A3437).
- CTA: "Not sure where you fit?" + "Get in touch" red pill → Connect.

### 5. Give (`Give.dc.html`)
- Hero: H1 "Giving is part of how we worship." + ScriptureLine (2 Cor 9:7).
- 3 method cards (#FBF5E9 radius 18): GCash / Bank transfer / In person.
  Each: 48px red icon disc, title Poppins 600 20px, description. GCash and
  bank cards contain dashed placeholder boxes (border dashed
  rgba(142,14,30,.35), text #8E0E1E) — swap for real details + QR image.
- "Where your giving goes": photo slot 240px + short paragraph + "Ask a
  question" outline pill → Connect.

### 6. Connect (`Connect.dc.html`)
- Hero: 2-col (1.3fr 1fr): text + prayer photo slot (260px radius 16).
- Prayer form card (white, border rgba(20,19,21,.1), radius 20, shadow
  0 14px 40px rgba(0,0,0,.06)): name (optional), location select (9 locations
  + "I'm not part of Quest yet"), request textarea (required), confidential
  checkbox (accent-color #D81E2F). Submit red pill.
  On submit → success state: 60px #FDE4E7 circle with red check, thank-you
  message, "Send another request" outline pill. In production, wire to a
  backend/email/Google Form; requests marked confidential go only to the
  prayer team.
- Side cards: Facebook message card, Plan-a-visit card (#FBF5E9, hover
  #F4ECDC), and a dashed FAQ card ("What happens to my request?").

## Interactions & Behavior
- Header is fixed; page heroes use 170px top padding to clear it.
- Smooth scrolling for in-page anchors: `window.scrollTo({behavior:'smooth'})`
  with a ~70px header offset. Do NOT use scrollIntoView-free-scroll without
  offset; content hides under the fixed header.
- Carousel behavior spec'd in Home section above.
- Hovers: red pills #D81E2F→#B81529; outline pills gain rgba(20,19,21,.05)
  bg; cream cards #FBF5E9→#F4ECDC; nav links darken to #141315. All ~200ms.
- Location picker and sermon-archive tabs are simple client state.
- Form: HTML5 required on textarea; success state replaces the form.

## State Management
- Home: `slide` (carousel index, timer-driven), `sat` (selected location).
- Sermons: `tab` (archive filter).
- Connect: `sent` (form success flag).
No global state, no routing state — plain per-page component state.

## Design Tokens
Colors:
- Brand red #D81E2F (primary CTAs, accents); hover/pressed #B81529
- Maroon #8E0E1E (eyebrows, secondary accents); deep #2E0408
- Red tint #FDE4E7 (badges, active tiles); light red #F26A77 (on dark)
- Ink #141315 (headings, dark surfaces); body text rgba(20,19,21,.6–.75)
- Cream #FBF5E9 (section/card bg); cream hover #F4ECDC
- White #ffffff; borders rgba(20,19,21,.06–.22); on-dark text
  rgba(255,255,255,.45–.88)

Typography (Google Fonts):
- Poppins 600 — all headings + card titles (60/48/44/40/34/30/26/24/21/20/19/17/16px)
- Manrope 400/600/700 — body, UI, eyebrows (18/17/16/15/14/13/12/11/10px)
- Eyebrow pattern: Manrope 700 12px, uppercase, letter-spacing .2em, #8E0E1E
- Body line-height 1.6–1.75

Spacing & shape:
- Content max-width 1080px; section padding 90–120px vertical, 40px horizontal
- Radii: cards 18, large media 20, inner media 12–16, pills 999
- Shadows: hero media 0 16px 44px rgba(0,0,0,.14); cards 0 10–14px 28–40px
  rgba(0,0,0,.06); carousel 0 16px 44px rgba(0,0,0,.12)
- Motion: 200ms hovers; 600ms cubic-bezier(.4,0,.2,1) carousel; respect
  prefers-reduced-motion

## Assets
- `logo-mark.png` — round Quest Laguna disc mark (rasterized from brand
  materials; request vector SVG from client for production)
- `campaign-banner.jpg` — NEXTLEVEL Stronger 2026 campaign banner
- Inline SVG icons (Facebook, map pin, clock, users, check, phone, bank) —
  simple 2px-stroke line icons; Lucide is a drop-in match
- YouTube channel: UCqyGbGmIG_CmocMrAnrufsA; Facebook: facebook.com/questlaguna
- `image-slot.js` — prototype-only drag-and-drop placeholder component; in
  production replace every `<image-slot>` with a real photo

## Files
- `ChurchWebsite.dc.html` — Home
- `Sermons.dc.html` — Sermons & services archive
- `News.dc.html` — News & announcements
- `Ministries.dc.html` — Ministries
- `Give.dc.html` — Give
- `Connect.dc.html` — Connect / prayer request
- `SiteHeader.dc.html`, `SiteFooter.dc.html` — shared chrome
- `ds-base.js` — loads the design-system stylesheet + component bundle (prototype plumbing)
- `styles.css` + `colors_and_type.css` (project root) — full design-token set
- `image-slot.js` — placeholder component (prototype only)
