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
│   ├── panel.css            # all panel styling, namespaced .pk-*
│   ├── fonts.js              # injects @font-face rules for the bundled font
│   └── components/
│       ├── import.js, export.js, help.js, settings.js
│       #  ^ template-only screens for the hamburger menu.
│       #    panel.js wires the actual behavior; these just build markup.
├── utils/
│   └── dom.js              # el() — the ONLY generic DOM helper. Not a
│                            #  dumping ground for real UI screens.
└── assets/fonts/            # bundled Atkinson Hyperlegible Next + its OFL license
```

```
scripts/copy-assets.mjs   # postbuild: copies src/assets/ -> a top-level
                           # assets/ folder (sibling to dist/, NOT inside it —
                           # see fonts.js's own comments for why the depth matters)
test/                      # one file per src/ file it covers, plus panel.test.js
                           # for the UI layer (jsdom) and *.test.js for pure logic
examples/vanilla/          # a working "real host page" — the dev sandbox,
                           # and also proof the token system actually works
```

## The core mental model: two tracks

Everything in `panel.js` follows a strict separation between two things
that get touched completely differently:

- **Track 1 — internal working state.** Sliders, presets, Reset. Only
  ever touches the in-memory `state` object and the panel's own preview
  elements (one per tab). Nothing here ever reaches the real page.
- **Track 2 — the real host page.** Only ever touched by **Save**
  (persists `state` to storage — does NOT touch the page) and by
  **Close** and the **initial mount** (both read storage and apply it
  to `document.documentElement` — the only two places Track 2 is ever
  written to, both gated on the `autoLoadPaused` setting).

If you're adding a new feature and find yourself wanting to touch
`document.documentElement` from somewhere other than those two places,
that's very likely the wrong place to do it.

## How a color/text/motion/focus change actually flows

1. User moves a slider or picks a preset → `panel.js`'s event listener
   updates `state` directly (e.g. `state.colors.primary = {...}`).
2. `panel.js` calls `applyColors()`/`applyText()`/`applyMotion()`/
   `applyFocus()` from `core/engine.js` against the **panel's own
   preview element** for that tab (Track 1).
3. `renderAllPreviews()` re-applies the FULL combined state to every
   tab's preview, not just the one being edited — so switching tabs
   never shows stale/unreadable content from before the change.
4. The same `engine.js` functions are used again, unchanged, when Close
   applies the saved state to `document.documentElement` (Track 2).
   This is the whole point of `engine.js` accepting a `target`
   parameter — there is no separate "preview styling" code path;
   the preview IS proof the token system works, using the exact same
   function calls a real host page's Close event uses.

## The storage layer

`storage/index.js` is the only file anything else should import from —
never an adapter directly. It owns:

- **`isValidState()`** — strict _shape_ validation (right fields, right
  types). This is NOT the same as value-range clamping (a `hue` of
  99999 would currently pass shape validation) — see
  `decisions/architecture.md`'s Import/Export section for the current
  state of that gap.
- **`get()`/`set()`/`clear()`** — preferences (colors/text/motion/focus),
  stored under `prefkeeper-preferences`.
- **`getSettings()`/`setSettings()`** — a SEPARATE key
  (`prefkeeper-settings`), currently just `{ autoLoadPaused }`. Kept
  separate from preferences because it's app config, not user
  preference data, with a different validation shape and lifecycle.
- **`exportState()`/`importState()`** — pure functions (no side effects,
  never call `set()` themselves). `panel.js`'s Import screen decides
  when/whether to actually persist what comes back.

Adapters (`localStorageAdapter.js`, `extensionAdapter.js`) are
deliberately "dumb" — they only do raw get/set/clear of a value.
Validation and JSON conversion live once, in `index.js`, and apply
identically no matter which adapter is active.

## Presets and the customPresets extension point

`src/presets/*.js` export plain data: `{ key: { label, values } }`.
`panel.js` imports the defaults and merges them with anything passed
via `initPrefKeeper({ customPresets })` — a custom key with the same
name as a built-in overrides it; anything else is added alongside.
The dropdown `<option>` elements are generated FROM this merged data
(via each preset's own `label`) — never hardcoded HTML — which is what
makes a custom preset show up as a real, selectable option automatically.

## The UI layer: engine + components

`panel.js` builds its own DOM at runtime (`buildTemplate()` → a
template-string, parsed via `utils/dom.js`'s `el()`) and inserts it
directly into `document.body` — there's no static HTML file to put
markup in, since PrefKeeper has no page of its own; it's dropped into
whatever page calls `initPrefKeeper()`.

The Colors/Text/Motion/Focus tabs all coexist in the DOM simultaneously
(`hidden` toggles which is visible) — this is what makes "every tab
shows the full combined state" work without extra plumbing. The
Import/Export/Help/Settings screens work differently: clicking a
hamburger item swaps `.pk-hamburger-screen-content`'s `innerHTML` to
that screen's template and shows a single overlay covering the entire
app (tabs included) until "← Back" is clicked. See
`decisions/architecture.md` for why a full overlay was chosen over
disabling/hiding controls individually.

Every DOM query inside `panel.js` is scoped to the panel's own
`container`, never `document.querySelector` directly — dropping into an
arbitrary host page means class names/ids can't be assumed unique
outside the panel's own subtree.

## Fonts

`ui/fonts.js` injects `@font-face` rules for all 14 bundled weight/style
combinations, resolving each file's URL via
`document.currentScript.src` (works for a plain `<script src>` drop-in)
falling back to `import.meta.url` (works for real ESM bundler
consumption). The 14 URLs are written as separate static expressions,
not built in a loop — see the file's own header comment for why that
specific detail matters (it's not just a style choice).

## Testing

- Pure logic (`core/`, `storage/`, `presets/`) runs in Vitest's default
  Node environment — no DOM needed.
- `fonts.js`, `panel.js`, and `utils/dom.js` need a real DOM to test
  against, so their test files run under `jsdom` — declared explicitly
  in `vitest.config.js`'s `environmentMatchGlobs`, not just the inline
  `// @vitest-environment jsdom` comment (some tooling, notably certain
  editor test-runner integrations, doesn't reliably honor the inline
  comment alone).
- jsdom tests verify _behavior_ (does clicking Save persist state, does
  the dirty-status message update correctly) — they do NOT verify
  _visual layout_ (jsdom doesn't do real CSS rendering). The flexbox/
  slider-height work, the overlay's visual centering, etc. were all
  confirmed by hand in a real browser, not by any automated test.
  Playwright e2e tests remain a planned-but-unbuilt way to make that
  kind of check repeatable — see the open items list in
  `decisions/architecture.md`.
