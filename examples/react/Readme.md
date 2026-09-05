# PrefKeeper — React example

**This folder will not run as-is inside this repo.** PrefKeeper's own
repo isn't a React project, so there's no build tooling here to make
these files execute. This is a copy-paste starting point — drop these
files into a real React project and they'll work correctly there.

## What's in here

- **`App.jsx`** — a small demo page, styled with `var(--pk-*)` tokens,
  same content/structure as [`../vanilla/index.html`](../vanilla/index.html)
  so both examples demonstrate the identical integration.
- **`PrefKeeperButton.jsx`** — a small reusable component that opens
  the panel. Accepts an optional `customPresets` prop.
- **`index.css`** — imports the two CSS files `npx prefkeeper-setup`
  generates, plus real site styling referencing `var(--pk-*)`.

## How to actually try this

1. Create a real React project, if you don't have one already —
   e.g. `npm create vite@latest my-app -- --template react`.
2. Inside that new project:
   ```bash
   npm install prefkeeper
   npx prefkeeper-setup
   ```
   This creates a `prefkeeper/` folder at your project root (fonts,
   `panel.css`, `prefkeeper-root.css`).
3. Copy `App.jsx`, `PrefKeeperButton.jsx`, and `index.css` from this
   folder into your new project's `src/`, replacing whatever Vite
   scaffolded there by default.
4. Make sure your `src/main.jsx` renders `<App />` (Vite's default
   scaffold already does this — no change usually needed).
5. `npm run dev` and open it — you should see the demo page, and
   clicking the button should open PrefKeeper.

## Adding your own custom presets

`App.jsx` has a commented-out example showing the exact shape — the
same "Forest" theme used to verify this feature works in the vanilla
example, so you can compare the two side by side. Un-comment it (and
comment out the plain `<PrefKeeperButton />` below it) to see a real
custom preset show up in the Colors tab's dropdown.

See the main [README's "Custom presets" section](../../README.md#custom-presets)
for the full explanation of what each field means.

## If something doesn't show up styled correctly

Double-check the `@import` paths at the top of `index.css` — they
assume `prefkeeper/` sits at your project root and this file lives at
`src/index.css`, which is Vite's default layout. If your project
structure is different, adjust those two paths to match.
