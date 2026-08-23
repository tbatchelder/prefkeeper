# PrefKeeper — Roadmap

Status board, not a decision log — see
[`decisions/architecture.md`](./decisions/architecture.md) for the
_why_ behind anything here.

## v1 — done

Colors, Text, Motion, Focus tabs; presets (with a `customPresets`
extension point); Import/Export; Settings/Pause; Save/Reset/View Site
Default/Clear All; bundled font; full test suite (jsdom + Node,
Vitest); npm packaging verified via dry-run publish;
`prepublishOnly` + `allowScripts` safety nets in place.

## Immediate next steps

- [ ] Decide public-repo timing (currently private) — your call, not a
      technical blocker.
- [ ] Real `npm publish` once ready (name confirmed available, dry-run
      already clean).
- [ ] Cross-browser check (Firefox, Safari) — the vertical-slider CSS
      technique has only been confirmed in Chromium so far.
- [ ] Playwright e2e tests — the jsdom test suite verifies _behavior_,
      not _visual layout_; nothing automated currently protects the
      flexbox/slider-height/overlay-centering work from regressing.

## v1.x / v2 ideas (not yet built)

- **User-registerable themes.** Different from the existing
  `customPresets` option (which a _developer_ configures in code at
  `initPrefKeeper()` time) — this would let an _end user_ import/name
  their own theme through the Import panel itself, so it shows up as a
  real dropdown option, not just applied once.
- **More color targets.** Success/Warning messages, secondary buttons,
  and inputs currently don't respond to color changes at all — they'd
  need their own dedicated tokens (not a reuse of Background/Text/
  Buttons/Links, since a success message shouldn't literally become
  "whatever background color the user picked").
- **Typed/numeric value entry.** HSL fields you can type an exact
  number into, as an alternative to the sliders — something like a
  "Normal vs. Professional" mode toggle for the Controls panel. Whatever
  writes these values needs the same clamping discipline the sliders
  get for free from their `min`/`max` attributes — see the note in
  `panel.js`'s color-slider handler.
- **Multiple saved profiles per device.** The biggest architectural
  lift of this list — today's storage model is one preference blob per
  key; this would need a named-collection shape plus a concept of which
  profile is currently active, touching Save, Import/Export, and the
  eventual extension's auto-load logic all at once.

## v2 / v3 — separate future projects

- **React wrapper.** Not started; no architecture decisions made yet
  (hook vs. component vs. both).
- **Browser extension.** The mechanism for true cross-site preference
  persistence (today's localStorage is per-origin) — design already
  discussed (content-script + DOM-event "mail slot" model, since a page
  can never directly call an extension), nothing built.
