# Design rules — Quest Laguna

## Direction: image-rich, human, immersive

The client rejected a plain/corporate look. Every page should feel like a
community of real people, not a faceless organization:

- Every major section carries at least one photo, banner, or photo collage.
  Use `PhotoSlot` (with a descriptive `label` of the intended shot) until
  real congregation photos arrive — never ship a text-only wall.
- Home leads with a full-bleed photo hero (`HeroBanner` with `image`) and a
  banner carousel of upcoming events and campaigns (`EventsCarousel`).
- Photos of people > graphics > illustrations. Warm, candid, congregation
  shots. Gradient overlays (`from-ink/75 via-maroon-deep/60`) keep text
  readable on photos.
- The home hero uses the client's provided campaign banner (currently the
  NEXTLEVEL "Stronger" cover, `/images/campaign-banner*.jpg`) — client
  preference 2026-08-08 after a stock-photo hero was rejected. The dark
  gradient overlay carries text legibility; do not swap this image without
  asking.
- Site photos come from the client folder under `public/images/`
  ("WEBSITE 2026…"). The raw exports are social cards with a red frame and a
  baked-in caption; always crop to the inner photo before shipping (see the
  cropped set in `public/images/site/`). Never render the framed originals.
- Prefer the client's own photos everywhere. A stock-photo pass was tried and
  rejected (2026-08-08) — if stock ever comes back, it needs the client's
  sign-off first, must be free-license and unidentifiable (Filipino-plausible,
  backs/raised hands, no faces), and gets logged in
  `public/images/site/SOURCES.md`.
- Match the photo box to the photo. Wide full-width bands use natural aspect
  (`h-auto w-full`), not short fixed heights — object-cover in a shallow box
  cuts faces off group shots.

## Tone (from client, non-negotiable)

- Formal, modern, warm, human. NOT marketing/corporate. When copy starts
  sounding like a campaign ("a seat with your name on it"), plain it down.
- No stats bands, no salesy copy, no em-dashes in body text. Short plain
  sentences.
- Site copy is English (client decision 2026-08-08). Filipino appears only in
  editorial CMS content written by marketing (campaign names, article titles
  like "Isang dekada ng katapatan") — leave that untouched, but do not
  hardcode Tagalog headings or taglines into pages.
- Minimize internal jargon on public pages. Handbook terms like "SIDE PAD"
  (culture acronym), "Schooling"/"Sending" (membership pipeline stages), and
  the org structure are internal teaching material — present the underlying
  values and steps in visitor language instead (see src/lib/site.ts comments).

## Tokens (defined in src/styles/global.css @theme — use utilities, never hex)

- Colors: `brand` #D81E2F, `brand-press` #B81529, `maroon` #8E0E1E,
  `maroon-deep` #2E0408, `red-tint` #FDE4E7, `red-soft` #F26A77,
  `ink` #141315, `cream` #FBF5E9, `cream-hover` #F4ECDC, `gold` #E8B11F.
- Type: `font-display` (Poppins 600) for all headings; `font-sans` (Manrope)
  for body/UI. Eyebrow pattern = `Eyebrow` component.
- Shape: `rounded-card` (18px), `rounded-media` (16px), pills `rounded-full`.
- Shadows: `shadow-card`, `shadow-media`, `shadow-carousel`.
- Content max-width 1080px; section padding ~py-16 mobile / ~py-24 desktop.

## Mobile-first (primary audience)

- Design at 390px first, enhance upward; verify at 360px.
- Tap targets ≥ 44px (`min-h-11`).
- Images: explicit width/height or aspect ratio (no CLS), `loading="lazy"`
  below the fold, `fetchpriority="high"` only for the hero.
- Never ship a raw YouTube iframe — facade pattern only.
- Keep client JS near zero: vanilla `<script>` islands only where the
  handoff specifies behavior (carousel, menu, tabs, form).

## Motion

- Hovers 200ms; carousel 600ms cubic-bezier(.4,0,.2,1), auto-advance 5s,
  pause on hover, dot click resets timer.
- Everything respects `prefers-reduced-motion` (disable autoplay and
  transitions, not just animations).
