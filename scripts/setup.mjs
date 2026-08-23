#!/usr/bin/env node
/**
 * setup.mjs
 *
 * Run via `npx prefkeeper-setup` -- a DELIBERATE command a developer
 * runs themselves, never an automatic install hook. That distinction
 * matters: npm v12's new install-time security defaults (allowScripts
 * off by default) specifically target automatic lifecycle scripts.
 * A bin command a developer chooses to run is a completely different,
 * unaffected mechanism -- same trusted pattern as `npx tailwindcss init`.
 *
 * Copies the bundled font files, panel.css, and a real starter CSS
 * file into the DEVELOPER's OWN project, at a path they control. Two
 * separate reasons feed into this, not one:
 *
 * 1. The runtime-injected @font-face approach (fonts.js) computes its
 *    font URLs by guessing where the currently-executing script is
 *    being served from -- reliable for a plain <script> tag, but
 *    silently wrong once a bundler (Vite, webpack) repackages the code
 *    into its own output structure. Verified empirically: a real Vite
 *    production build resolved the computed font URL to a location
 *    with zero files in it.
 *
 * 2. panel.css was found to be MISSING ENTIRELY from every published
 *    build until this was added -- tsup only bundles JavaScript, it
 *    never touched this plain CSS file. Even once fixed to ship inside
 *    dist/, relying on a developer referencing it straight from
 *    node_modules is its own separate risk: node_modules is
 *    conventionally a dev-only folder many static-site deploy
 *    workflows (Netlify, GitHub Pages, plain FTP) don't upload at all.
 *    Copying it into the developer's own project sidesteps that too.
 *
 * IMPORTANT ASYMMETRY: fonts/ and prefkeeper-root.css are meant to be
 * hand-edited (a developer's own site colors) -- copied ONCE, never
 * overwritten on a repeat run, so their edits are never clobbered.
 * panel.css is PrefKeeper's own tool chrome, never meant to be
 * hand-edited -- it's refreshed EVERY run, so it never silently goes
 * stale after a `npm update prefkeeper`.
 *
 * TESTABILITY: the real work lives in runSetup(), which takes its
 * source/target paths as PARAMETERS rather than hardcoding
 * process.cwd()/import.meta.url internally. That's what lets
 * test/setup.test.js call it against real temp directories without
 * needing to fake or mock the filesystem -- genuine integration-style
 * tests, matching how the rest of this project prefers to verify
 * things. The actual paths this script uses when run for real are
 * only resolved once, in the entry-point guard at the bottom, which
 * only fires when this file is executed directly (via npx), never
 * when it's imported by a test.
 *
 * Deliberately self-contained: the font/token data below is a SECOND
 * copy of what's in src/core/tokens.js and fonts.js, not a shared
 * import. This script runs in a completely different context -- a
 * consumer's own terminal, from the published package -- than
 * everything else in this codebase, and a small, obviously-correct
 * standalone file is safer here than a clever shared dependency that
 * might not resolve the way it does in every other context this code
 * runs in.
 */

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readdirSync,
  realpathSync
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FONT_FACES = [
  { file: 'AtkinsonHyperlegibleNext-ExtraLight.woff2', weight: 200, style: 'normal' },
  { file: 'AtkinsonHyperlegibleNext-ExtraLightItalic.woff2', weight: 200, style: 'italic' },
  { file: 'AtkinsonHyperlegibleNext-Light.woff2', weight: 300, style: 'normal' },
  { file: 'AtkinsonHyperlegibleNext-LightItalic.woff2', weight: 300, style: 'italic' },
  { file: 'AtkinsonHyperlegibleNext-Regular.woff2', weight: 400, style: 'normal' },
  { file: 'AtkinsonHyperlegibleNext-RegularItalic.woff2', weight: 400, style: 'italic' },
  { file: 'AtkinsonHyperlegibleNext-Medium.woff2', weight: 500, style: 'normal' },
  { file: 'AtkinsonHyperlegibleNext-MediumItalic.woff2', weight: 500, style: 'italic' },
  { file: 'AtkinsonHyperlegibleNext-SemiBold.woff2', weight: 600, style: 'normal' },
  { file: 'AtkinsonHyperlegibleNext-SemiBoldItalic.woff2', weight: 600, style: 'italic' },
  { file: 'AtkinsonHyperlegibleNext-Bold.woff2', weight: 700, style: 'normal' },
  { file: 'AtkinsonHyperlegibleNext-BoldItalic.woff2', weight: 700, style: 'italic' },
  { file: 'AtkinsonHyperlegibleNext-ExtraBold.woff2', weight: 800, style: 'normal' },
  { file: 'AtkinsonHyperlegibleNext-ExtraBoldItalic.woff2', weight: 800, style: 'italic' }
];

/**
 * Pure function -- no filesystem access, easy to unit test directly.
 * Matches src/core/tokens.js's colorDefaults/textDefaults/
 * motionDefaults/focusDefaults exactly, pre-converted to real
 * hsl()/px/unitless values.
 */
export function buildRootCss() {
  const fontFaceRules = FONT_FACES.map(
    ({ file, weight, style }) => `@font-face {
  font-family: 'Atkinson Hyperlegible Next';
  src: url('./fonts/${file}') format('woff2');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`
  ).join('\n\n');

  return `/**
 * Generated by \`npx prefkeeper-setup\`. Edit freely -- these are your
 * site's DEFAULT values. PrefKeeper's own JS overrides them live, using
 * these exact same --pk-* variable names, the moment a visitor sets a
 * real preference -- an inline style set via JS always outranks a
 * :root rule in a stylesheet, so there's no conflict, only an override.
 *
 * Link this file from your HTML (or import it in your bundler's CSS
 * entry point) BEFORE your own site CSS, so your own rules can still
 * override these defaults for anything PrefKeeper doesn't touch.
 */

${fontFaceRules}

:root {
  --pk-background: hsl(0, 0%, 100%);
  --pk-text: hsl(0, 0%, 13%);
  --pk-primary: hsl(210, 80%, 50%);
  --pk-on-primary: hsl(0, 0%, 100%);
  --pk-link: hsl(210, 80%, 40%);

  --pk-font-size: 100%;
  --pk-line-height: 1.5;
  --pk-letter-spacing: 0px;
  --pk-word-spacing: 0px;
  /* --pk-font-family intentionally omitted -- PrefKeeper only sets
     this when the visitor picks the Atkinson option; leaving it unset
     here means your own font-family rules apply until then. */

  --pk-reduce-motion: 1;

  --pk-focus-outline-color: hsl(200, 100%, 50%);
  --pk-focus-outline-width: 3px;
}
`;
}

/**
 * The real work, parameterized so tests can point it at real temp
 * directories instead of the real filesystem. Returns a small result
 * object (rather than just logging) so tests can assert on outcomes
 * without needing to capture console output.
 */
export function runSetup({ sourceFontsDir, sourcePanelCss, targetDir }) {
  const targetFontsDir = join(targetDir, 'fonts');
  const targetRootCssFile = join(targetDir, 'prefkeeper-root.css');
  const targetPanelCssFile = join(targetDir, 'panel.css');

  if (!existsSync(sourceFontsDir) || !existsSync(sourcePanelCss)) {
    return {
      ok: false,
      reason: `Could not find prefkeeper's own bundled files (fonts and/or panel.css). This usually means prefkeeper wasn't installed correctly -- try reinstalling.`
    };
  }

  const alreadySetUp = existsSync(targetDir);

  if (!alreadySetUp) {
    // Fonts + prefkeeper-root.css: created once, never touched again on
    // a repeat run -- these are meant to be edited/customized.
    mkdirSync(targetFontsDir, { recursive: true });
    const sourceFiles = readdirSync(sourceFontsDir);
    sourceFiles.forEach(filename => {
      copyFileSync(join(sourceFontsDir, filename), join(targetFontsDir, filename));
    });
    writeFileSync(targetRootCssFile, buildRootCss(), 'utf8');
  } else {
    mkdirSync(targetDir, { recursive: true }); // no-op if it already exists
  }

  // panel.css: PrefKeeper's own tool chrome, never meant to be
  // hand-edited -- always refreshed to match the currently installed
  // version, even on repeat runs (e.g. after `npm update prefkeeper`).
  copyFileSync(sourcePanelCss, targetPanelCssFile);

  return {
    ok: true,
    alreadySetUp,
    fontCount: readdirSync(targetFontsDir).length
  };
}

function printResult(result, targetDir) {
  if (!result.ok) {
    console.error(result.reason);
    return;
  }
  if (result.alreadySetUp) {
    console.log(
      `prefkeeper/ already exists at ${targetDir}. Left fonts/ and prefkeeper-root.css untouched (your edits are safe). Refreshed panel.css to match the currently installed version.`
    );
  } else {
    console.log(`Created prefkeeper/ in your project:
  prefkeeper/
  ├── fonts/                 (${result.fontCount} files)
  ├── prefkeeper-root.css     (edit freely -- your site's defaults)
  └── panel.css               (PrefKeeper's own UI styling -- do not edit;
                                refreshed automatically on future runs)

Link both CSS files from your HTML (or import them from your bundler's
CSS entry point), and you're set up. See the README for the full
integration guide.`);
  }
}

// Entry-point guard: this block only runs when the file is executed
// directly (via `npx prefkeeper-setup`), never when test/setup.test.js
// imports buildRootCss()/runSetup() -- those imports never trigger any
// real filesystem write.
//
// Uses realpathSync() rather than a naive string comparison against
// process.argv[1] -- npm's bin mechanism invokes this script through a
// SYMLINK (node_modules/.bin/prefkeeper-setup -> ../prefkeeper/scripts/
// setup.mjs), and import.meta.url resolves to the REAL underlying file
// while process.argv[1] keeps the symlink path as invoked. A plain
// equality check between them silently mismatches -- confirmed by
// actually invoking through a real symlink, not by reasoning about it:
// the naive version ran with zero output and zero files created,
// no error at all. realpathSync() resolves both sides consistently.
const isMainModule =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // This script always ships as a sibling of the top-level assets/ and
  // dist/ folders (all three at the published package's root -- see
  // package.json's "files" field and scripts/copy-assets.mjs, which is
  // what creates that layout at build time). Real, unbundled Node
  // execution, so these relative paths are safe in a way the
  // browser-side equivalent isn't.
  const result = runSetup({
    sourceFontsDir: join(__dirname, '..', 'assets', 'fonts'),
    sourcePanelCss: join(__dirname, '..', 'dist', 'panel.css'),
    targetDir: join(process.cwd(), 'prefkeeper')
  });
  printResult(result, join(process.cwd(), 'prefkeeper'));
  if (!result.ok) process.exit(1);
}
