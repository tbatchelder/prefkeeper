# PrefKeeper — Architecture Decisions

A running log of decisions made during design/prototyping, and why. Add new entries at the bottom as decisions get made or revisited.

---

## Naming

- **Chosen name: PrefKeeper.** Ties into the "Keeper" naming pattern already used for CorpKeeper — consistent personal brand across projects.
- Ruled out: `OpenA11Y` (trademark/W3C conflict risk), `a11ytheme` (existing old repo), `MyTheme` (taken on npm), `MyA11y` (working placeholder only, never final).
- Confirmed available at time of check: npm registry name `prefkeeper` was open.

---

## Core architecture

- **Storage adapter pattern.** All reads/writes go through a generic interface (`get()`, `set()`, `export()`, `import()`) defined once in `src/storage/index.js`. `localStorageAdapter.js` is the only implementation today. This is the seam that lets a future browser extension (`extensionAdapter.js`, using `chrome.storage`) swap in later without touching `engine.js` or `panel.js`.
- **One JSON blob, not per-category storage.** All preferences (Colors, Text, Motion, Focus) live in a single saved object. This is why the dirty-state UI is shared across tabs (see below) rather than per-tab independent state.
- **CSS custom property convention: `--a11y-*` namespace.** PrefKeeper never touches a developer's existing `:root` variables. Developers opt in by referencing PrefKeeper's namespaced variables in their own CSS (or, for Tailwind users, by mapping their `@theme` tokens to reference `--a11y-*` values). This avoids all `:root` collision risk at the cost of requiring explicit developer adoption — decided as the right tradeoff over a mapping/adapter layer (deferred, see Follow-ups) or Shadow DOM encapsulation (rejected — doesn't fit "restyle the whole page" model).
- **Tailwind v4 compatibility note:** Tailwind v4 generates real CSS custom properties from `@theme` by default, which makes wiring Tailwind sites to PrefKeeper's tokens more straightforward than under Tailwind v3's JS-config model. Still requires the developer to actively map their theme vars to `--a11y-*` — not automatic.
- **Zero runtime dependencies.** Icons are inline SVG (Lucide-style paths, MIT licensed), not a CDN icon font or JS library — avoids CSP breakage, offline failure, and network dependency for something meant to be a lightweight drop-in.

## Scope boundary (what PrefKeeper does and does not do)

- **In scope:** Color (text, background, links, buttons, button text, focus rings), Text (size, line-height, letter-spacing, word-spacing, font-family swap), Motion (reduced-motion toggle), Focus (outline color/width).
- **Explicitly out of scope:** Semantic HTML, alt text, ARIA roles/labels, keyboard navigation. These require the developer to write correct markup — no CSS-variable trick can retrofit them.
- **Why this boundary matters beyond scope creep:** the accessibility-overlay industry (UserWay, accessiBe, EqualWeb, etc.) drew heavy, sustained criticism from disabled users and accessibility advocates for claiming automated widgets could "fix" missing alt text or bad ARIA — often making pages worse for screen reader users while marketing as compliance solutions. PrefKeeper's positioning is deliberately the opposite: "changes how your site looks, not what it says." This should be stated explicitly in public docs, not just held as an internal principle.
- Image/gradient color adjustment and embedded text-in-images are out of scope; anyone wanting that would need to build and fund it separately.

## UI/UX decisions

- **Header/navigation:** No "Home" tab (wasn't doing anything). No "Theme" wording (PrefKeeper doesn't store "themes," it stores preferences). Tabs are the category list itself: `Colors | Text | Motion | Focus`, with room to add more categories later.
- **Import/Export/Help/Close** live as icon buttons in the top-right, separate from the footer's Save/Reset actions — data operations vs. editing actions are treated as different classes of action.
- **Import/Export UI will NOT be a modal.** Since this must be mobile-ready, the plan is to swap the Preview/Controls area out for a full import/export view (paste/copy JSON, Copy All button) rather than use a fixed-position overlay, which fights viewport sizing on mobile.
- **Security requirement (from bootcamp security class):** any pasted import content MUST be strictly sanitized/validated as the expected JSON shape before use. Anything that doesn't match is discarded. Not yet implemented — flagged as a hard requirement, not a nice-to-have.
- **Presets are dropdowns, not buttons.** Buttons scale their footprint with option count (overflow risk on narrow screens); a dropdown's footprint stays constant. Split into two dropdowns: Contrast/Mode (High Contrast, Low Contrast, Dark Mode, Light Mode) and Color Vision (four types).
- **Color-blindness naming uses plain language first, clinical term in parentheses** — e.g. "Red-green, most common (Deuteranopia)" — since most users won't recall the Greek terms. Ordered by real-world prevalence (deuteranopia and protanopia, both "red-green," are most common; tritanopia and achromatopsia are rarer).
- **Calculations (contrast ratio badge)** pinned to the bottom of the Controls panel via `flex: 1` on the sliders container above it.
- **Save / Reset / Restore Site Default have distinct, deliberately different semantics:**
  - **Save** — writes current working values to storage. Does not touch the live website. The only fully deliberate, explicit "commit" action.
  - **Reset [Category]** — reverts the app's working values back to defaults. Does not save, does not touch the live site. Counts as an unsaved (dirty) state, same as any other edit.
  - **Restore Site Default** — requires a confirm dialog first. If confirmed, wipes all saved storage, reverting the live site (on next close) to the designer's original look. Counts as an immediately-persisted action, not a pending change.
- **Dirty-state model is shared across all four tabs, since it's one JSON.** A `Set` of dirty categories (`colors`, `text`, `motion`, `focus`) drives one shared message rendered identically in all four tabs' status blocks — e.g. "Color and Motion changes not saved" — rather than four independent per-tab states.
- **Close behavior:** clicking Close checks the dirty-category set.
  - If dirty: show a confirm dialog worded as **"You have unsaved changes. [Cancel] [Save and Close]"** — deliberately avoiding ambiguous Yes/No phrasing, since the wording itself should make the outcome obvious without relying on a visual nudge.
  - If not dirty: closes immediately.
  - **Only Close applies stored values to the live website** (reads from storage, sets the real page's `--a11y-*` variables). Save only persists to storage; it does not touch the live page. Slider/control changes only ever affect the internal `.preview` mock, never the live site directly.
- **No animated nudges toward Save or any other action.** A pulsing arrow or similar motion-based visual cue would be undermined by PrefKeeper's own reduced-motion feature — the very users most likely to need extra guidance could have that guidance suppressed by their own settings. Clear, unambiguous wording is the chosen alternative to any nudge mechanism.
- **Focus preview shows the outline only on genuine `:focus`** (not a permanently-visible fake state), to test the real mechanism. Flagged as worth revisiting after real-world testing, since a developer's own focus-related transitions/animations may interact with this in ways not yet observed.

## Typography

- **Atkinson Hyperlegible** chosen as the featured "accessible font" option (over OpenDyslexic and the initial Comic Sans placeholder). SIL Open Font License — free for commercial/open-source use, no attribution required.
- **Text panel offers a live side-by-side comparison** (site font vs. Atkinson Hyperlegible) via radio buttons showing real rendered sample text, rather than a checkbox asking the user to trust a label like "dyslexia-friendly font."
- **Must be bundled into the npm package itself**, not loaded from a CDN — no CDN dependency, no extra install step for the developer, works offline for the end user. The `.woff2` file lives in package assets; the build copies it into `dist/`; `panel.js` injects a `@font-face` rule pointing at the bundled path at runtime.
- **PrefKeeper's own panel UI will also use Atkinson Hyperlegible** as its chrome font, once self-hosted — "eating your own dog food" as an accessibility tool.
- Decision to keep the font choice to exactly two options (site font vs. Atkinson) for now, deferring a curated multi-font list until real user feedback indicates it's wanted.

## Technical implementation notes

- **Vertical range sliders** required abandoning `-webkit-appearance: slider-vertical` (non-standard, causes Chrome to paint a native `accent-color` fill over any custom track background) in favor of `writing-mode: vertical-lr` + `direction: rtl` + `appearance: none` with fully custom `::-webkit-slider-runnable-track` / `::-webkit-slider-thumb` (and Moz equivalents).
- **Live-updating gradients and thumb colors** use CSS custom properties (`--thumb-color`, `--track-bg`) set via JS on the `<input>` element itself — these inherit into the element's own pseudo-elements the same way they'd inherit into child elements, which is what makes the thumb-matches-current-hue effect work.
- **Known caveat, not yet tested:** cross-browser behavior of this vertical-slider technique in Firefox and Safari hasn't been verified — only tested in a Chromium-based environment so far.
- **Prototype-to-production expectation:** most of the CodePen HTML will not survive the transition to the real package — it'll be rebuilt as JS-constructed DOM (`document.createElement()` / template strings) inside `panel.js`, since PrefKeeper has no page of its own to own HTML in. The CSS carries over largely as-is (with namespaced selectors). The prototype's job was proving the slider/pseudo-element mechanism worked before committing it to real architecture — that job is done.

---

## Open follow-ups for next session

- [ ] Build the Import/Export panel: full Preview/Controls-area swap (not modal), paste-in field, Copy All button, and **strict JSON sanitization/validation** of any pasted content before use (reject and discard anything that doesn't match the expected shape).
- [ ] Decide whether tabs need a visual indicator (e.g. a dot) showing which specific tab(s) have unsaved changes, beyond the shared status-block wording.
- [ ] Finalize exact confirm-dialog copy for Restore Site Default (the "this will erase your saved preferences..." wording was drafted but not final).
- [ ] Bundle Atkinson Hyperlegible `.woff2` into package assets and wire up the build step to copy it into `dist/`.
- [ ] Apply Atkinson Hyperlegible as PrefKeeper's own panel chrome font once self-hosted.
- [ ] Test the vertical range slider technique in Firefox and Safari.
- [ ] Revisit the Focus tab's "only show outline on real `:focus`" decision after some real testing/developer feedback.
- [ ] Write `docs/SCOPE.md` capturing the in-scope/out-of-scope boundary explicitly, including the overlay-industry rationale, so future contributors (and Tim's own future self) have it in writing.
- [ ] Write `docs/decisions/naming.md` with the naming rationale and alternatives considered (can mostly be pulled from this doc).
- [ ] Begin porting the CodePen prototype into the real repo structure (`src/core/engine.js`, `src/storage/localStorageAdapter.js`, `src/storage/extensionAdapter.js` stub, `src/ui/panel.js`, `src/presets/`).
- [ ] Formalize the storage-adapter interface in code (currently only conceptual/`localStorage`-direct in the prototype).
- [ ] Gather feedback from tomorrow's coach Q&A and the general Q&A meeting; fold any resulting changes back into this document.
