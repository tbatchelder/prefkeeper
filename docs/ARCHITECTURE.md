# PrefKeeper — Architecture

A practical map of the codebase: what lives where, and how data actually
flows. For _why_ things are built this way, see
[`decisions/architecture.md`](./decisions/architecture.md) — that's the
chronological decision log; this is the "orient yourself here" doc.

## Folder structure

```
src/
├── index.js              # public entry point — everything a consumer imports
├── core/
│   ├── tokens.js          # the --pk-* variable names + default values
│   ├── engine.js          # turns token state into real CSS custom properties
│   └── contrast.js        # WCAG luminance/contrast-ratio math
├── storage/
│   ├── index.js            # the ONE public storage API (validated get/set/etc.)
│   ├── localStorageAdapter.js   # real implementation, used today
│   └── extensionAdapter.js      # stub — future browser-extension backend
├── presets/
│   ├── contrast.js         # High/Low Contrast, Dark/Light Mode
│   ├── colorblind.js       # color-vision presets
│   └── index.js            # re-exports both
├── ui/
│   ├── panel.js             # the "engine" — state, wiring, every event listener
│   ├── panel.css             # all panel styling, namespaced .pk-*
│   ├── fonts.js              # runtime @font-face injection (see Fonts below)
│   └── components/
│       ├── import.js, export.js, help.js, settings.js
│       #  ^ template-only screens for the hamburger menu.
│       #    panel.js wires the actual behavior; these just build markup.
├── utils/
│   └── dom.js              # el() — the ONLY generic DOM helper.
└── assets/fonts/            # bundled Atkinson Hyperlegible Next + its OFL license
```

```
scripts/
├── copy-assets.mjs   # postbuild: copies src/assets/ -> a top-level assets/
│                      #  folder AND src/ui/panel.css -> dist/panel.css.
│                      #  Excluded from test coverage (runs real logic on
│                      #  import, verified manually across many real builds).
└── setup.mjs          # the `npx prefkeeper-setup` CLI a developer runs
                        #  themselves (never an automatic install hook).
                        #  Copies fonts + panel.css + a generated
                        #  prefkeeper-root.css into THE DEVELOPER's OWN
                        #  project. Structured as an exported, parameterized
                        #  runSetup() + buildRootCss(), with a guarded entry
                        #  point at the bottom — see test/setup.test.js and
                        #  decisions/architecture.md for why that structure
                        #  matters (a real symlink bug was found and fixed
                        #  in exactly that guard).
```

```
test/                      # one file per src/ (or scripts/) file it covers
examples/vanilla/          # a working "real host page" dev sandbox
```

## The core mental model: two tracks

Everything in `panel.js` follows a strict separation between two things
that get touched completely differently:

- **Track 1 — internal working state.** Sliders, presets, Reset. Only
  ever touches the in-memory `state` object and the panel's own preview
  elements. Nothing here ever reaches the real page.
- **Track 2 — the real host page.** Only ever touched by **Save**
  (persists `state` to storage — does NOT touch the page) and by
  **Close** and the **initial mount** (both read storage and apply it
  to `document.documentElement`, gated on the `autoLoadPaused` setting).

## How a color/text/motion/focus change actually flows

1. User moves a slider or picks a preset → `panel.js` updates `state`
   directly.
2. `panel.js` calls `applyColors()`/`applyText()`/`applyMotion()`/
   `applyFocus()` from `core/engine.js` against the panel's own preview
   element for that tab (Track 1).
3. `renderAllPreviews()` re-applies the FULL combined state to every
   tab's preview, not just the one being edited.
4. The same `engine.js` functions are used again, unchanged, when Close
   applies the saved state to `document.documentElement` (Track 2) —
   there is no separate "preview styling" code path.

## The storage layer

`storage/index.js` is the only file anything else should import from.
It owns `isValidState()` (strict shape validation — NOT value-range
clamping), `get()`/`set()`/`clear()` (preferences), `getSettings()`/
`setSettings()` (a separate `prefkeeper-settings` key), and the pure
`exportState()`/`importState()`. Adapters are deliberately "dumb" —
just raw get/set/clear.

## Presets and the customPresets extension point

`src/presets/*.js` export plain data: `{ key: { label, values } }`.
`panel.js` merges the defaults with anything passed via
`initPrefKeeper({ customPresets })`. Dropdown `<option>` elements are
generated FROM this data, never hardcoded HTML.

## The UI layer: engine + components

`panel.js` builds its own DOM at runtime and inserts it directly into
`document.body` — there's no static HTML file, since PrefKeeper has no
page of its own. The Colors/Text/Motion/Focus tabs coexist in the DOM
(`hidden` toggles visibility); the hamburger screens work differently —
a single overlay swaps its content and covers the entire app, including
the tabs, until "← Back" is clicked.

Every DOM query inside `panel.js` is scoped to the panel's own
`container`, never `document.querySelector` directly.

## Fonts and CSS delivery — two mechanisms, each for a different case

**This is more involved than it looks, and getting it wrong is easy —
see `decisions/architecture.md` for the full story of two real bugs
found here.** In short:

1. **`ui/fonts.js`** auto-injects `@font-face` rules at runtime,
   computing font URLs via `document.currentScript.src` (falling back
   to `import.meta.url`). This genuinely works, but ONLY when nothing
   repackages the code between `dist/index.js` and the browser — true
   for a plain `<script>` tag, NOT guaranteed once a bundler (Vite,
   webpack) is involved. Confirmed broken in that case with a real Vite
   build before this limitation was understood.

2. **`scripts/setup.mjs`** (`npx prefkeeper-setup`) is the fix for the
   bundler case, and also for `panel.css` itself, which was found to be
   completely missing from every published build (`tsup` only bundles
   JS, never touched that plain CSS file). It copies real files — fonts,
   `panel.css`, a generated `prefkeeper-root.css` — directly into the
   developer's own project, so their own bundler/HTML references plain,
   static paths instead of anything computed at runtime.

Both mechanisms are kept, not one replacing the other — each is correct
for the case it actually works in.

## Testing

- Pure logic (`core/`, `storage/`, `presets/`) runs in Vitest's default
  Node environment.
- `fonts.js`, `panel.js`, and `utils/dom.js` need jsdom — declared
  explicitly in `vitest.config.js`'s `environmentMatchGlobs`, not just
  the inline `// @vitest-environment jsdom` comment (some editor
  integrations don't reliably honor the inline comment alone).
- `scripts/setup.mjs` is tested via genuine integration-style tests
  (`test/setup.test.js`) against REAL temporary directories (not
  mocks) — the file is structured specifically to make this possible:
  the real work lives in an exported, parameterized `runSetup()`, with
  actual filesystem paths only resolved in a guarded entry-point block
  that never fires when the file is imported by a test.
  `scripts/copy-assets.mjs` remains excluded from coverage reporting —
  a much simpler script that runs its real logic on import, verified
  manually across many real builds instead.
- jsdom tests verify _behavior_, not _visual layout_ — the flexbox/
  slider-height work, the overlay's visual centering, etc. were
  confirmed by hand in a real browser. Playwright e2e tests remain a
  planned-but-unbuilt way to make that kind of check repeatable.
