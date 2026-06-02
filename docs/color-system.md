# Sliding Tiles Color System

Sliding Tiles keeps shared color and shadow tokens in `apps/web/app/globals.css`
inside the Tailwind `@theme` block. Component classes should prefer these
tokens over raw hex values, RGB/RGBA values, or one-off arbitrary Tailwind
colors.

## Architecture

Tokens are grouped by UI purpose:

- `background`, `surface`, `panel`, `line`, `foreground`, and `muted` cover the
  base application shell, cards, borders, and text.
- `primary` and `success` cover the main green action and positive states.
- `info`, `warning`, `danger`, and `clay` cover semantic supporting states.
- `night`, `frog-lime`, `celebration`, and `medal-*` cover gameplay and
  leaderboard-specific presentation.
- `shadow-*` tokens centralize repeated focus rings, buttons, panels, tile
  bevels, and board overlays.

## Naming

Prefer purpose-first names. Use suffixes consistently:

- `-strong` for darker text or emphasis.
- `-soft` for quiet backgrounds.
- `-surface` for slightly richer card backgrounds.
- `-border` and `-text` only when a purpose-specific family needs separate
  readable tones, such as medals.

When writing components, use Tailwind token classes such as `bg-primary-soft`,
`text-info-strong`, `border-line`, or `shadow-button-primary`. For gradients,
use CSS variables from the same tokens, for example
`var(--color-warning-soft)`.

## Adding Tokens

Introduce a new token when:

- The color represents a new semantic role.
- The same color or near-duplicate appears in multiple components.
- A state needs a stable dark-mode or contrast treatment.
- A gameplay-specific color needs to remain consistent across screens.

Reuse an existing token when the color is a minor variation of an existing
surface, border, text, primary, info, warning, success, danger, or clay role.
Avoid adding tokens for single decorative glints unless they become reusable.

## Intentional Exceptions

Some raw color math may remain in component-level gradients when it is
decorative atmosphere rather than a reusable UI state. The frog image asset,
tile image treatment, and celebration glow effects can also keep localized
values when they are functioning as artwork rather than interface chrome.
