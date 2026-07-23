now, some v2 things to think about.

Allowing devs to import or register a theme of their own which we'll add to the import function panel when it opens - either import a text tile or import a pre-registered theme.

Add on more items for color changes

Possibly a panel to allow someone to type in HSL values instead if they want that option; same for some of the other values too I think. Kind of like a "normal" vs "professional" flipper button for Controls.

Possibly a means to save multiple preferences for different users using the same device and therefore the ability to import the one you need.

Some things to consider for when we build this out of CodePen:

Export which need a panel which gives the user all of the JSON so they can copy and paste it somewhere.

Import will need full sanitization and security checks from the input field to ensure not only is it legal JSON but not malicious either.

Sorry to hear about the coach — hopefully it's the family situation resolving rather than something more permanent, but either way that's out of your hands. Good that the other coach's reaction leaned toward "how do we ship this," though — that's actually a more useful signal than pure enthusiasm.

Given everything already proven in CodePen, here's the porting order I'd follow — sequenced so Vitest has something to test almost immediately, and the riskiest/most CodePen-specific part (the DOM-building UI) comes last, once everything underneath it is solid:

**Phase 1 — headless logic (no DOM, fully unit-testable):**

1. `src/core/tokens.js` — canonical `--a11y-*` variable names + your existing `colorDefaults`/text/motion/focus defaults, ported straight from the prototype's JS objects.
2. `src/core/contrast.js` — your `luminance()` / `contrastRatio()` functions, unchanged logic, just relocated.
3. `src/storage/index.js` + `localStorageAdapter.js` — formalizes `saveToStorage()` into the real `get()`/`set()`/`export()`/`import()` interface from the original architecture doc.
4. `src/core/engine.js` — the generalized version of `applyColorTargetToPreview()`, except instead of writing inline styles onto a `.preview` div, it writes real `document.documentElement.style.setProperty('--a11y-*', ...)` calls onto the actual host page.
5. First Vitest tests, against #1–#4 only — this is genuinely valuable this early, since none of it needs a browser or DOM to verify.

**Phase 2 — presets:** 6. `src/presets/colors.js`, `text.js`, `motion.js`, `focus.js` — your `contrastPresets`/`colorVisionPresets` objects and whatever text/motion/focus defaults exist, extracted out of the CodePen inline code into their own files, each just exporting data + maybe a small apply helper.

**Phase 3 — the UI (built last, most CodePen-transferable, but needs care in translation):** 7. `src/ui/panel.js` — this is where the CodePen HTML becomes `document.createElement()`/template-string DOM construction, and all your existing behavior — tab switching, dirty-state tracking, hamburger menu, Save/Reset/Restore/Close, the View Site Default toggle — gets rewired to call into `engine.js`/`storage`/`presets` instead of touching `.preview` directly. 8. `src/ui/panel.css` — largely a copy-paste of what you already have, just namespaced (`.prefkeeper-*` instead of `.mya11y-*`) so it can't collide with a host page's existing classes. 9. `examples/vanilla/index.html` — a bare test page that calls `initPrefKeeper()`, becomes your new "click around and see it work" environment, replacing CodePen.

**Phase 4 — proving it, packaging it:** 10. `test/e2e/` — Playwright tests against `examples/vanilla/index.html`, confirming the real DOM/CSS-variable behavior end-to-end, not just the logic in isolation. 11. CI workflow + issue templates — you've got the shapes already sketched from the earlier scaffold conversation; just needs to actually get committed. 12. `docs/SCOPE.md` and the naming doc — already drafted in spirit from tonight's `DECISIONS.md`; worth formalizing into their own files once the code's real, so contributors hit them before the code.

**Where I'd start right now, given you asked "what's the plan":** Phase 1, item 1 — `tokens.js`. It's the smallest, most foundational file, everything else in Phase 1 references it, and it's a direct, low-risk port of things you've already fully designed and tested in the prototype.

Want me to write `tokens.js` now, pulling directly from your CodePen's `colorDefaults` plus the text/motion/focus default values, so you've got the first real source file in the actual repo?
