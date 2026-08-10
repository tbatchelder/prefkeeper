# Naming Decisions

## Package name: PrefKeeper

Ties into the "Keeper" naming pattern already used for CorpKeeper —
consistent personal brand across projects.

**Ruled out:**

- `OpenA11Y` — trademark/W3C conflict risk
- `a11ytheme` — an existing old repo already used this name
- `MyTheme` — taken on npm
- `MyA11y` — working placeholder only, never intended as final

Confirmed available on the npm registry (checked directly against
`registry.npmjs.org`) as of the decision date, and reconfirmed
immediately before the actual publish.

## CSS custom property prefix: `--pk-*`

Originally planned as `--a11y-*`, changed early on. `a11y` is a generic
category name other tools, browser extensions, or even a future
standard could plausibly also claim — a real collision risk with zero
warning if it ever happened. `--pk-*` is unique to this project.

## Bundled font: Atkinson Hyperlegible Next

Chosen over the older "Atkinson Hyperlegible" family and over
OpenDyslexic. Braille Institute of America, SIL Open Font License —
free for commercial/open-source use and redistribution, provided the
license text travels with the font files (see
`src/assets/fonts/OFL.txt`).
