# ADR-0003: Editorial / scientific-journal aesthetic for the frontend

**Status:** Accepted
**Date:** 2026-05-06

## Context

ReviewPyPerAPI is a tool for systematic literature reviews — a deeply
academic workflow. The earlier UI used a generic SaaS-template aesthetic
(Inter font, blue-600 primary, white cards on gray-50, lucide icons).
That look is increasingly indistinguishable from any other AI-product
landing page and doesn't telegraph the domain.

The `frontend-design` skill explicitly warns against this default:
> Avoid generic AI-generated aesthetics like overused font families
> (Inter, Roboto, Arial), cliched color schemes, predictable layouts,
> and cookie-cutter design that lacks context-specific character.

## Decision

Adopt an **editorial / scientific-journal** visual direction with these
specific choices:

### Typography

- **Display** (h1–h4, brand mark, card titles): **Source Serif 4** —
  refined scholarly serif designed for screen reading.
- **Body**: **IBM Plex Sans** — clean, technical, distinctive without
  being eccentric. Replaces the previous Inter usage.
- **Monospace** (paths, IDs, "Step 0X" labels, dates): **JetBrains Mono**.

Loaded via Google Fonts CSS in `index.css`. No local font tooling.

### Palette

Defined as semantic tokens in `@theme` (Tailwind v4 CSS-first config):

```
--color-background: oklch(98.4% 0.006 85)   /* warm paper */
--color-surface:    oklch(100% 0 0)
--color-foreground: oklch(18% 0.01 264)     /* near-black ink */
--color-primary:    oklch(38% 0.07 200)     /* deep teal — single accent */
--color-muted:      oklch(95.5% 0.01 85)
--color-border:     oklch(89% 0.008 85)
```

Single restrained accent (deep teal) in place of the previous bright
blue. State colors (success, warning, danger) use lower-chroma values
for the same reason.

### Layout

- Sidebar: editorial brand mark with mono "v3" tag, uppercase mono
  section labels.
- Header: display-serif project name, mono uppercase metadata
  (review type, creation date) — "magazine masthead" framing.
- **PipelineStepper** (`components/PipelineStepper.tsx`) on every page,
  derived from `pipeline_state` so completion is visible at a glance.
- Page headings: mono "Step 0X" eyebrow + display-serif title.

## Consequences

### Positive

- The product reads as a research tool, not a generic SaaS.
- Semantic tokens make eventual dark mode trivial (override the same
  variables in a `.dark` selector).
- Restrained palette + serif headings reduce visual fatigue during
  long review sessions.

### Negative

- Google Fonts dependency at runtime. If the team later wants offline
  builds, the fonts will need to be self-hosted.
- Designers / contributors must respect the direction; ad-hoc
  `bg-blue-500` etc. will look out of place.

## Operational rules

- New components must use semantic tokens
  (`bg-[var(--color-surface)]`, `text-[var(--color-foreground)]`),
  not raw scales (`bg-white`, `text-gray-900`).
- Use `cn()` from `lib/utils.ts` (not raw `clsx`) so consumer overrides
  resolve through `tailwind-merge`.
- Page headings follow the "eyebrow + display title" pattern. If you're
  building a new step, copy it from `pages/SetupReview.tsx`.

## Migration notes (in-flight)

- The legacy `--color-primary-50…950` scale is still defined in
  `index.css` so any straggler `bg-primary-600` usages render. Migrate
  them to semantic tokens as you touch the file. Once all pages use
  semantic tokens, the legacy scale block can be deleted.
