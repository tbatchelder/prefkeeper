# PrefKeeper — Scope

## What PrefKeeper does

- **Color** — text, background, links, buttons (background and text
  independently), focus rings
- **Text** — size, line-height, letter-spacing, word-spacing, font-family
  swap (site font vs. bundled Atkinson Hyperlegible Next)
- **Motion** — a reduced-motion toggle a developer's own CSS keys off of
- **Focus** — outline color/width

## What PrefKeeper explicitly does not do

Semantic HTML, alt text, ARIA roles/labels, keyboard navigation. These
require the developer to write correct markup — no CSS-variable trick
can retrofit them.

Image/gradient color adjustment and embedded text-in-images are also out
of scope; anyone wanting that would need to build and fund it separately.

## Why this boundary matters beyond scope creep

The accessibility-overlay industry (UserWay, accessiBe, EqualWeb, etc.)
drew heavy, sustained criticism from disabled users and accessibility
advocates for claiming automated widgets could "fix" missing alt text or
bad ARIA — often making pages _worse_ for screen reader users while
marketing as compliance solutions.

PrefKeeper's positioning is deliberately the opposite: **it changes how
a site looks, not what it says.** Presentation is PrefKeeper's domain.
Markup and semantics stay the developer's responsibility, same as they
always have been. This isn't a limitation to apologize for — it's the
thing that keeps PrefKeeper honest about what it can actually promise.
