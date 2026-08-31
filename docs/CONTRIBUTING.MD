# Contributing to PrefKeeper

## Getting started

```bash
git clone <repo-url>
cd prefkeeper
npm install
npm test
```

All 100+ tests should pass on a clean install. If they don't, that's
worth reporting before anything else — see
[`docs/decisions/architecture.md`](./docs/decisions/architecture.md)
for a running log of real environment-specific issues already found
(e.g. `typescript` needing to be an explicit devDependency, an npm v12
`allowScripts` gotcha with `esbuild`).

## Development workflow

```bash
npm test              # run the full test suite
npm run test:watch    # same, but watches for changes
npm run test:coverage # full suite + a coverage report
npm run format        # apply Prettier
npm run format:check  # check formatting without changing anything (what CI runs)
npm run build         # build dist/ + copy assets/panel.css (what a real publish does)
```

`npm run build` runs `tsup`, then a `postbuild` step
(`scripts/copy-assets.mjs`) that copies the bundled fonts and
`panel.css` into place. If you only run `tsup` directly and skip the
full `npm run build`, you'll get a `dist/` missing both.

## Testing philosophy

This project prefers **real verification over mocks** wherever
practical:

- `storage.test.js` uses a real in-memory `localStorage` stub (real
  `getItem`/`setItem` calls), not a mocked module.
- `setup.test.js` runs `scripts/setup.mjs`'s actual logic against real
  temporary directories (`fs.mkdtempSync`), not fake filesystem objects.
- Several real bugs this project has hit (a font-loading path that
  only broke under a real bundler, a CSS file silently missing from
  the actual published tarball, a symlink-resolution bug in the setup
  CLI) were only ever found by testing the **real, built, packaged
  artifact** — not by reasoning about the code, and not by unit tests
  alone. If you're touching packaging, the build pipeline, or anything
  in `scripts/`, the bar is: does this survive a real
  `npm run build && npm pack`, installed into a genuinely separate,
  clean project? Not "does it look right."

**Known, accepted gap:** the jsdom-based UI tests (`panel.test.js`,
`fonts.test.js`) verify _behavior_ — does clicking Save persist state,
does the dirty-status message update correctly — not _visual layout_.
jsdom doesn't do real CSS rendering. If you change anything in
`panel.css` or the flexbox/slider sizing logic, **test it in a real
browser** before considering it done. Playwright e2e coverage for this
is planned but not yet built (see `docs/ROADMAP.md`).

## Testing the actual npm package (not just the source)

If you change anything in `scripts/`, `package.json`'s `files`/`bin`/
`exports` fields, or anything font/CSS-delivery related:

```bash
npm run build
npm pack
```

Then, in a **completely separate, freshly created folder** (not one
you've used before for this):

```bash
npm init -y
npm install /path/to/prefkeeper/prefkeeper-<version>.tgz
npx prefkeeper-setup
```

**Gotcha worth knowing up front:** if you re-pack after making a
change and reinstall into a project you've already used before, npm
can silently reuse a cached/stale version instead of picking up your
new tarball. If something seems to still be running old code after a
change, don't debug the code first — delete `node_modules` and
`package-lock.json` in the test project and reinstall clean, or just
use a brand new folder each time. This has already cost real
debugging time more than once.

**Also worth knowing:** `localStorage` is scoped to the browser origin
(`http://localhost:PORT`, or a `file://` path), not to which version of
the package is installed. Old preference data from a previous test
session will keep showing up until you clear it yourself — that's
normal, not a bug.

## Code style

Prettier config lives in `.prettierrc.json` (single quotes, no
trailing commas, 2-space indent). Run `npm run format` before
committing — CI runs `format:check` and will fail on unformatted code.

## Scope

Read [`docs/SCOPE.md`](./docs/SCOPE.md) before proposing a feature.
PrefKeeper deliberately covers presentation only (color, text, motion,
focus) — never semantic HTML, ARIA, or alt text. This isn't an
oversight; seeing why it matters (and the accessibility-overlay
industry's history) is worth reading before opening an issue that
falls outside it.

## Where things live

[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) is a practical map of
the codebase — what's where, how a change actually flows through the
system. [`docs/decisions/architecture.md`](./docs/decisions/architecture.md)
is the _why_ behind specific choices, including real bugs found and
how they were fixed — worth searching before re-deciding something
that's already been through this once.

## Pull requests

See the PR template for the checklist. In short: tests pass, code is
formatted, and if you touched UI or fonts, you've actually looked at
it in a real browser — not just trusted that jsdom passing means it
looks right.
