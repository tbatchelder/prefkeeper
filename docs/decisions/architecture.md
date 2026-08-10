# PrefKeeper — Architecture Decisions

A running log of decisions made during design/development, and why.
Add new entries at the bottom as decisions get made or revisited.

Naming rationale has moved to [`naming.md`](./naming.md); the
in-scope/out-of-scope boundary has moved to [`../SCOPE.md`](../SCOPE.md).

---

## Core architecture

- **Storage adapter pattern.** All reads/writes go through a generic
  interface (`get()`, `set()`, `clear()`, `getSettings()`,
  `setSettings()`, plus the pure `exportState()`/`importState()`
  helpers) defined once in `src/storage/index.js`.
  `localStorageAdapter.js` is the only real implementation today;
  `extensionAdapter.js` is a stub throwing "not implemented" — the seam
  for the future browser extension to swap in without touching
  `engine.js` or `panel.js`.
- **Preferences and settings are separate storage keys.**
  `prefkeeper-preferences` holds the four editable categories (colors/
  text/motion/focus). `prefkeeper-settings` holds app config
  (`autoLoadPaused`) — conceptually different data with a different
  lifecycle, not user-editable preference values.
- **One JSON blob per category set, not per-field storage.** All
  preferences live in a single saved object. This is why the dirty-state
  UI is shared across tabs (see below) rather than four independent
  states.
- **CSS custom property convention: `--pk-*` namespace.** PrefKeeper
  never touches a developer's existing `:root` variables. Developers
  opt in by referencing PrefKeeper's namespaced variables in their own
  CSS. See [`naming.md`](./naming.md) for why `--pk-` over the
  originally-planned `--a11y-`.
- **Zero runtime dependencies.** Icons are inline SVG, not a CDN icon
  font or JS library. The bundled font ships inside the package itself,
  not loaded from a CDN. Both choices avoid CSP breakage, offline
  failure, and network dependency for something meant to be a
  lightweight drop-in.

## UI architecture: engine + components

`panel.js` is the state/wiring "engine" — it owns `state`, dirty-state
tracking, and every event listener. It does not contain the actual
HTML/UI templates for the Colors/Text/Motion/Focus tabs or the
Import/Export/Help/Settings screens; those live as small template
functions in `src/ui/components/`, one file per screen, each exporting
a `buildXScreen()` function that returns an HTML string. This keeps
`panel.js` from becoming an ever-growing wall of inline template
literals as more screens/presets get added.

`src/utils/dom.js` holds only genuinely generic, content-agnostic DOM
helpers (currently just `el()`, which parses an HTML string into a
real detached element) — it is deliberately NOT a dumping ground for
actual UI screens.

## Hamburger menu: full overlay, not disable/hide

Import, Export, Help, and Settings render as a single overlay screen
that covers the **entire app, tabs included** — not just the
Preview/Controls area (an earlier plan). Reaching one of these screens
hides everything else behind it; a "← Back" button returns to normal
tab view without touching any tab's underlying state at all (nothing
was ever removed or changed, so there's nothing to restore).

This was chosen over disabling or hiding the tabs/Save/Reset/View-
Default buttons individually while a hamburger screen is open. That
approach would need real state tracking across seven separate controls
to get right, and a half-disabled background is exactly the kind of
thing that trips up keyboard/screen-reader users — a bad look for an
accessibility tool specifically. A full overlay makes the bad state
impossible to reach at all, rather than requiring careful prevention
every time.

The backdrop (behind the whole app, dimming the host page) is
deliberately **not** wired to close anything on click — only the X
button closes the app, with its unsaved-changes check intact. An
accidental click just outside the panel while mid-edit should never be
able to silently discard someone's changes.

## Save / Reset / View Site Default / Clear All — four distinct actions

- **Save** — writes current working values to storage. Does not touch
  the live website. The only fully deliberate, explicit "commit" action.
- **Reset [Category]** — reverts the _active tab's_ working values back
  to defaults. Does not save, does not touch the live site. Counts as
  an unsaved (dirty) state, same as any other edit.
- **View Site Default** (footer toggle) — a temporary, non-destructive,
  view-only flip of the panel's own internal preview between "my
  preferences" and "the site's original look." Never touches storage or
  the real host page at all; resets itself automatically on refresh
  since nothing was ever persisted.
- **Clear All Saved Preferences** (hamburger, confirm-gated) — the
  actual destructive action. Wipes storage entirely, resets every tab
  to defaults. Counts as immediately persisted, not a pending change.
  Does NOT touch the real host page yet — like Save, that only happens
  at Close.

## Dirty-state model

A `Set` of dirty categories (`colors`, `text`, `motion`, `focus`) drives
one shared status message rendered identically across all four tabs'
status blocks — e.g. "Color and Motion changes not saved" — rather than
four independent per-tab states. The initial paint explicitly syncs
this to "Saved" on mount (a fresh load with nothing edited should never
show a false "unsaved changes" warning, which the template's hardcoded
placeholder text did before this was caught in testing).

## Close behavior, and the ONLY two places the real host page is touched

Clicking Close checks the dirty-category set:

- If dirty: shows a confirm dialog worded as **"You have unsaved
  changes. [Cancel] [Save and Close]"** — deliberately avoiding
  ambiguous Yes/No phrasing.
- If not dirty: closes immediately.

**Only Close, and the initial mount, ever apply state to the real host
page** (`document.documentElement`) — both gated on `autoLoadPaused`
(see Settings/Pause below). Slider/preset/import changes only ever
affect the internal preview elements, never the live site directly,
until one of those two moments.

## Settings and Pause (shared boolean)

The Settings screen's "Auto-load my preferences on every page" checkbox
and the hamburger's "Pause Auto-Load" shortcut read/write the **same**
persisted value (`autoLoadPaused`, in `prefkeeper-settings`). Pause
exists as a one-tap shortcut to the same setting, for showing the site
to someone else without preferences applied, without navigating into
Settings first.

When paused, both the initial mount-time apply and Close's apply are
skipped — Close shouldn't quietly reapply preferences mid-demo just
because someone happened to close the panel while paused, which would
defeat the entire point of pausing.

Without the browser extension, this only meaningfully controls
same-origin auto-apply-on-load. True cross-tab/cross-device pause
behavior depends on the extension existing (see the extension design
notes) — a known, accepted v1 limitation, not an oversight.

## Import / Export

- **Import** loads parsed data into the working `state` object and
  marks all four categories dirty — the same "not saved until you hit
  Save" discipline as any other edit, no separate save path. If there
  are already unsaved changes, it warns and asks for confirmation
  before overwriting, via the same confirm pathway as Close.
- Validation reuses `storage.importState()` — the same shape-validation
  every path into storage goes through, not a separate ad hoc parser.
  Invalid JSON shows an inline error in the Import screen rather than a
  disruptive `alert()`.
- **Export** provides both a "Copy All" button (clipboard) and a real
  file download (Blob + temporary `<a download>`), no confirmation
  popup after either — the browser's own download indicator already
  covers that.
- **Security note (verified, not just assumed):** JSON.parse is not
  vulnerable to prototype pollution via a `"__proto__"` key — this is
  spec-defined behavior (JSON.parse builds objects via
  CreateDataProperty, not normal assignment, so a `"__proto__"` key in
  parsed JSON becomes an ordinary own property, never the real
  prototype). Verified empirically, not just asserted. Independently,
  PrefKeeper's own Import handler only ever reads four specific named
  properties from the parsed object (`colors`/`text`/`motion`/`focus`)
  — never a generic merge — so even in a hypothetical unsafe-JSON.parse
  world, nothing in this codebase would be exposed. Worth revisiting if
  a future feature ever does a _recursive/deep_ merge of imported data
  (the real historical source of prototype-pollution CVEs, e.g. older
  `lodash.merge`/`$.extend(true, ...)`), which nothing here does today.

## Custom presets (public extension point)

`initPrefKeeper({ customPresets: { contrast: {...}, colorVision: {...} } })`
merges caller-supplied presets with the built-in defaults from
`src/presets/`. A custom key matching a built-in name overrides it; any
other key is added alongside. This is what lets a company (or any
developer) layer in their own private preset — never published in this
open-source package, never requiring a fork — and have it show up as a
real, labeled, selectable dropdown option, generated from the preset's
own `label` field rather than hardcoded HTML.

## Typography

- **Atkinson Hyperlegible Next** — see [`naming.md`](./naming.md) for
  why this specific family. All 14 weight/style combinations are
  bundled (~380KB total) so a developer adopting it as their site's
  whole type system has the full range, not just what PrefKeeper's own
  chrome happens to use.
- Bundled inside the package itself (`src/assets/fonts/`, copied to a
  top-level `assets/` folder at build time, sibling to `dist/`) — no
  CDN dependency. `fonts.js` resolves the font file URLs at runtime via
  `document.currentScript.src` (for plain `<script>` tag / IIFE usage)
  falling back to `import.meta.url` (for real ESM bundler consumption).
  This was arrived at after discovering esbuild does NOT natively
  support the `new URL(path, import.meta.url)` asset-copying pattern
  the way Vite does — that's an open esbuild feature request, not
  shipped behavior, confirmed by testing directly.
- The Text tab offers a live side-by-side comparison (site font vs.
  Atkinson Hyperlegible Next) via radio buttons showing real rendered
  sample text, rather than a checkbox asking the user to trust a label.
- PrefKeeper's own panel chrome also uses Atkinson Hyperlegible Next —
  "eating your own dog food" as an accessibility tool.
- Font choice stays at exactly two options (site font vs. Atkinson) for
  now; a curated multi-font list is deferred until real user feedback
  indicates it's wanted.

## Technical implementation notes

- **Vertical range sliders** use `writing-mode: vertical-lr` +
  `direction: rtl` + `appearance: none` with fully custom
  `::-webkit-slider-runnable-track` / `::-webkit-slider-thumb` (and Moz
  equivalents), rather than the non-standard
  `-webkit-appearance: slider-vertical` (which paints a native
  `accent-color` fill over any custom track background). Sliders grow
  to fill whatever height is actually available (`flex: 1`, sane
  min/max floor and ceiling) rather than a fixed `vh`/`px` formula —
  this also fixed a real bug where `align-items: flex-start` was
  silently preventing slider groups from stretching to fill their row.
- **Cross-tab live preview:** every tab's preview reflects the full
  combined working state (all four categories), not just its own
  category — if someone changes colors because they couldn't read the
  default scheme, every other tab needs to be readable too, not just
  the one they're currently on.
- **Known caveat, not yet tested:** cross-browser behavior of the
  vertical-slider technique in Firefox and Safari — only verified in a
  Chromium-based environment so far.

## Publishing / packaging

- **`prepublishOnly: npm run build`** guarantees a real `npm publish`
  always ships a freshly-built `dist/`/`assets/`, never a stale build
  from an earlier session. Verified by deliberately corrupting a build
  output file and confirming the dry-run publish silently rebuilt it
  clean first.
- **`allowScripts` pre-approval for esbuild** (pinned to its exact
  resolved version) added proactively ahead of npm v12's new
  install-time security defaults, which make dependency
  install/postinstall scripts opt-in rather than automatic. This
  protects future contributors' `npm install` from silently skipping
  esbuild's platform-binary fetch — it does NOT affect anyone who later
  runs `npm install prefkeeper` themselves, since the published package
  has zero runtime dependencies and no install script of its own.
  Version-pinned by design: re-approval is needed whenever esbuild's
  resolved version changes.

---

## Open items (current, not historical)

- [ ] Cross-browser testing of the vertical-slider technique in
      Firefox and Safari.
- [ ] Revisit the Focus tab's "only show outline on real `:focus`"
      decision after more real-world testing/feedback.
- [ ] Whether tabs need a visual indicator (e.g. a dot) showing which
      specific tab(s) have unsaved changes, beyond the shared
      status-block wording — never decided either way.
- [ ] `docs/ARCHITECTURE.md` (a contributor-facing map of the codebase,
      distinct from this decisions log) is still an empty placeholder.
- [ ] `docs/ROADMAP.md` needs a rewrite — it currently holds an old,
      fully-completed porting plan rather than actual future items.
- [ ] Success/Warning/secondary-button/input color targets — deferred
      to v1.5/v2, would need their own dedicated tokens (not a reuse of
      Background/Text/Buttons/Links).
- [ ] React wrapper and the browser extension are both real, planned,
      and entirely unstarted — separate future projects, not part of
      the v1 core module.
