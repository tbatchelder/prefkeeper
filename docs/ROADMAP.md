# PrefKeeper — Roadmap

Status board, not a decision log — see
[`decisions/architecture.md`](./decisions/architecture.md) for the
_why_ behind anything here.

## v1 — done

Colors, Text, Motion, Focus tabs; presets (with a `customPresets`
extension point); Import/Export; Settings/Pause; Save/Reset/View Site
Default/Clear All; bundled font; full test suite (jsdom + Node,
Vitest); npm packaging verified via dry-run publish and a real
consumer-side install/test cycle; `prepublishOnly` + `allowScripts`
safety nets in place; `npx prefkeeper-setup` CLI tool for reliable
font/CSS delivery into a developer's own project (fixes a real
bundler-repackaging bug and a missing-`panel.css`-from-every-build bug,
both found via testing the actual published package as a genuine
outside consumer); CI (GitHub Actions: format check, test, build) and
issue/PR templates in place.

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
  `customPresets` option (a _developer_ configures it in code) — this
  would let an _end user_ import/name their own theme through the
  Import panel itself, so it shows up as a real dropdown option.
- **More color targets.** Success/Warning messages, secondary buttons,
  and inputs currently don't respond to color changes at all — they'd
  need their own dedicated tokens.
- **Typed/numeric value entry.** HSL fields you can type an exact
  number into, as an alternative to the sliders.
- **Multiple saved profiles per device.** The biggest architectural
  lift of this list — today's storage model is one preference blob per
  key.

## v2 / v3 — separate future projects

- **React wrapper.** Not started; no architecture decisions made yet.
- **Browser extension.** The mechanism for true cross-site preference
  persistence — design already discussed (content-script + DOM-event
  "mail slot" model), nothing built.
