---
name: quest-section
description: Build a new image-rich page section for quest-web following Quest Laguna's design language (tokens, photo slots, overlays, mobile-first). Use when adding or restyling any page section or page.
---

# Building a Quest Laguna page section

Read `.claude/rules/design.md` for the full rules. This skill is the how-to.

## Section skeleton

Every section follows this shape — full-bleed background, 1080px content:

```astro
<section class="px-5 py-16 md:px-10 md:py-24" aria-label="...">
  <div class="mx-auto max-w-[1080px]">
    <Eyebrow>Section eyebrow</Eyebrow>
    <h2 class="mt-3 text-3xl md:text-4xl">Section title</h2>
    <!-- content -->
  </div>
</section>
```

Alternate section backgrounds for rhythm: white → `bg-cream` → white.
Dark sections use `bg-ink text-white`.

## Making it image-rich (mandatory)

Every major section carries at least one visual. Pick the right pattern:

- **Photo cards** — cream card + photo on top (see `aboutCards` on the home
  page): `PhotoSlot` h-[170px], red rule `h-[3px] w-[34px] bg-brand`, title,
  body.
- **Photo strip** — 3-col collage: `grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]`
  with `PhotoSlot` heights 230–300px, `rounded-media`.
- **Full-bleed banner** — `HeroBanner` with `image` prop (dark gradient
  overlay is built in).
- **Carousel** — `EventsCarousel` for anything banner-like and rotating.

Until real photos exist, use `PhotoSlot label="describe the intended shot"`.
The label tells the client exactly what photo to supply.

## Real images (when photos arrive)

```astro
<img src={src} alt="..." width="640" height="480"
     loading="lazy" class="h-[170px] w-full rounded-media object-cover" />
```

- Always explicit dimensions or aspect class (CLS).
- `loading="lazy"` below the fold; `fetchpriority="high"` hero only.
- Text over photos needs `bg-gradient-to-b from-ink/75 via-maroon-deep/60`.

## Cards, pills, chips

- Card: `rounded-card bg-cream p-8 hover:bg-cream-hover transition-colors duration-200`
  (white cards on cream sections: `border border-ink/5 bg-white`).
- CTA: `PillButton` (primary / outline / ghost-dark on photos).
- Chip/badge: `rounded-full bg-red-tint px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-maroon`.
- Eyebrow: always the `Eyebrow` component, never hand-rolled.

## Mobile-first checklist (before done)

- [ ] Reads well at 360px; grids collapse (`sm:grid-cols-2 lg:grid-cols-4`).
- [ ] Tap targets ≥44px (`min-h-11`).
- [ ] Type scales down (`text-3xl md:text-4xl`, hero `text-4xl md:text-6xl`).
- [ ] Any motion respects `prefers-reduced-motion`.
- [ ] `npm run build` passes.
- [ ] Run the quest-ui-reviewer agent on the change.
