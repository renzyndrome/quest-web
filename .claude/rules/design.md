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
  `maroon-mid` #5C0A14, `maroon-deep` #2E0408, `red-tint` #FDE4E7,
  `red-soft` #F26A77, `ink` #141315, `ink-1000` #0B0B0C, `elevated` #1A1416,
  `cream` #FBF5E9, `cream-hover` #F4ECDC, `cream-200` #E9DDC4 (borders on
  cream), `gold` #E8B11F, `gold-deep` #8F680F (gold that passes AA on light).
- Type: `font-display` (Poppins 600) for every heading and the wordmark;
  `font-sans` (Manrope) for body and UI. The poster faces in the handoff's
  token file (Oswald, Anton) were tried on the site 2026-09-06 and rejected:
  uppercase condensed type read as campaign artwork, not a church.
  - Sizes come from the scale only: `text-display-xl/lg/md/sm` (page h1,
    section h2, band h2, numerals; add the `display` utility for the tight
    tracking), `text-title-lg/title/title-sm`, `text-body-lg/body/body-sm`,
    `text-small`, `text-micro`. Never hand-type `text-[15px] leading-[1.7]`.
  - Sentence-style headings end in a period ("Welcome home."); noun labels
    do not ("Events", "Life testimonies").
  - Copy tone is calm and understated: state facts, avoid commands and
    direct "you", no contractions in hardcoded copy.
- Surfaces: white, `bg-cream`, `bg-maroon-deep` for the rare dark band, and
  `bg-scrim-b` for the single overlay on a photo band. `bg-black-red` +
  `grain` is for the 404 page only. Page heroes are cream by default; `/` and
  `/visit` use a photo. The footer scripture is a small line in the bottom
  bar, never a band (client feedback 2026-09-06).
- Shape: `rounded-card` (18px), `rounded-media` (16px), `rounded-tile` (12px),
  `rounded-btn` (pill) for buttons and chips.
- Shadows: `shadow-card`, `shadow-media`, `shadow-carousel`, `shadow-red-glow`
  (primary button on a dark surface).
- Rhythm: `px-gutter`, `py-section` / `py-section-sm`, and the containers
  `max-w-content` (1080px), `max-w-narrow` (820px), `max-w-copy` (640px).
- Eyebrow = the `Eyebrow` component (red `›››` chevrons, per the handoff).
- Section headers = `SectionHeading`; page heroes = `HeroBanner` with an
  explicit `variant`.

## Mobile-first (primary audience)

- Design at 390px first, enhance upward; verify at 360px.
- Tap targets ≥ 44px (`min-h-11`).
- Images: explicit width/height or aspect ratio (no CLS), `loading="lazy"`
  below the fold, `fetchpriority="high"` only for the hero.
- Never ship a raw YouTube iframe — facade pattern only. Same rule for Google
  Maps: `MapEmbed` shows the address and a directions link, and loads the embed
  only on tap. The raw embed is ~1.7 MB of Google JavaScript, four times the
  weight of everything else on `/visit`.
- Keep client JS near zero: vanilla `<script>` islands only where the
  handoff specifies behavior (carousel, menu, tabs, form).

## Motion

- Hovers 200ms; carousel 600ms cubic-bezier(.4,0,.2,1), auto-advance 5s,
  pause on hover, dot click resets timer.
- Motion is applied where it means something, never as a default coat. There
  is no blanket scroll-reveal, no card lift-and-zoom on hover: a card's hover
  is a border colour change. What still animates is the header solidifying on
  scroll, accordions opening, and the carousel.
- Everything respects `prefers-reduced-motion` (disable autoplay and
  transitions, not just animations).
