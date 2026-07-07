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

## Tone (from client, non-negotiable)

- Formal, modern, warm, human. NOT marketing/corporate.
- No stats bands, no salesy copy, no em-dashes in body text. Short plain
  sentences.
- Filipino code-switching (e.g. "Isang dekada ng katapatan") is intentional
  and on-brand — never "fix" it.
- Minimize internal jargon (SOD etc.) on public pages.

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
