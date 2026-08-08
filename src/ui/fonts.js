/**
 * fonts.js
 *
 * Injects @font-face rules for the bundled Atkinson Hyperlegible Next
 * files. This is what makes the font "just there" per the earlier
 * decision — no CDN, no separate install step for the developer, no
 * download step for the end user. The files live in src/assets/fonts/
 * and are copied to a top-level assets/ folder (sibling to dist/) by
 * scripts/copy-assets.mjs as part of `npm run build`.
 *
 * All 14 weight/style combinations are bundled (~380KB total) so a
 * developer who wants to build their whole site's type system around
 * this font — headings in ExtraBold, emphasis in Italic, body in
 * Regular — can actually do that, not just get a single fallback
 * weight PrefKeeper happens to use internally.
 *
 * CORRECTION (found by actually running the build, not by reasoning
 * alone): an earlier version of this file assumed esbuild's `file`
 * loader would automatically detect `new URL(path, import.meta.url)`
 * and copy/rewrite it, the way Vite does. It does not — that's an
 * open esbuild feature request, not shipped behavior. Verified with
 * both the real tsup build and an isolated minimal esbuild test;
 * neither copied anything.
 *
 * The actual fix doesn't depend on any bundler behavior at all — it
 * uses plain, native URL resolution, which genuinely works:
 *
 *   - ESM (real bundlers/native <script type="module">): import.meta.url
 *     is the real URL of this module once loaded — a native ESM
 *     feature, not something esbuild needs to process.
 *   - IIFE (plain <script src="..."> drop-in, no build step): captured
 *     via document.currentScript.src instead, since import.meta is
 *     genuinely unavailable outside real ES modules. This MUST be
 *     captured at top-level, synchronously, the moment this script
 *     first runs — document.currentScript is only valid during a
 *     script's initial synchronous execution, and becomes null by the
 *     time an async event handler (like opening the panel) later
 *     calls injectFontFaces().
 *   - CJS: neither mechanism reliably applies (CJS is realistically
 *     consumed by legacy Node-oriented bundlers, not loaded directly
 *     in a browser). Font injection is wrapped in try/catch so this
 *     degrades to the system font instead of throwing.
 *
 * Both real resolution paths were verified using Node's URL class
 * (same WHATWG spec browsers implement) against realistic base URLs —
 * see the PR/commit notes for the exact check.
 */

const FONT_FAMILY = 'Atkinson Hyperlegible Next';

// Captured ONCE, synchronously, at the moment this module first
// executes — not lazily inside injectFontFaces(), which usually runs
// later from an async event handler by which point
// document.currentScript would already be null.
const SCRIPT_BASE =
  (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) ||
  import.meta.url;

function fontUrl(filename) {
  return new URL(`../assets/fonts/${filename}`, SCRIPT_BASE).href;
}

const FONT_FACES = [
  {
    file: 'AtkinsonHyperlegibleNext-ExtraLight.woff2',
    weight: 200,
    style: 'normal'
  },
  {
    file: 'AtkinsonHyperlegibleNext-ExtraLightItalic.woff2',
    weight: 200,
    style: 'italic'
  },
  {
    file: 'AtkinsonHyperlegibleNext-Light.woff2',
    weight: 300,
    style: 'normal'
  },
  {
    file: 'AtkinsonHyperlegibleNext-LightItalic.woff2',
    weight: 300,
    style: 'italic'
  },
  {
    file: 'AtkinsonHyperlegibleNext-Regular.woff2',
    weight: 400,
    style: 'normal'
  },
  {
    file: 'AtkinsonHyperlegibleNext-RegularItalic.woff2',
    weight: 400,
    style: 'italic'
  },
  {
    file: 'AtkinsonHyperlegibleNext-Medium.woff2',
    weight: 500,
    style: 'normal'
  },
  {
    file: 'AtkinsonHyperlegibleNext-MediumItalic.woff2',
    weight: 500,
    style: 'italic'
  },
  {
    file: 'AtkinsonHyperlegibleNext-SemiBold.woff2',
    weight: 600,
    style: 'normal'
  },
  {
    file: 'AtkinsonHyperlegibleNext-SemiBoldItalic.woff2',
    weight: 600,
    style: 'italic'
  },
  { file: 'AtkinsonHyperlegibleNext-Bold.woff2', weight: 700, style: 'normal' },
  {
    file: 'AtkinsonHyperlegibleNext-BoldItalic.woff2',
    weight: 700,
    style: 'italic'
  },
  {
    file: 'AtkinsonHyperlegibleNext-ExtraBold.woff2',
    weight: 800,
    style: 'normal'
  },
  {
    file: 'AtkinsonHyperlegibleNext-ExtraBoldItalic.woff2',
    weight: 800,
    style: 'italic'
  }
];

let injected = false;

/**
 * Injects a <style> tag with @font-face rules for every bundled
 * weight/style. Idempotent — safe to call every time initPrefKeeper()
 * runs, even if multiple panels are mounted on the same page.
 *
 * Wrapped in try/catch: if URL resolution fails (the CJS case, or any
 * environment neither mechanism covers), PrefKeeper falls back to the
 * system font stack rather than throwing and breaking the panel.
 */
export function injectFontFaces() {
  if (injected) return;
  injected = true;

  try {
    const rules = FONT_FACES.map(
      ({ file, weight, style }) => `
      @font-face {
        font-family: '${FONT_FAMILY}';
        src: url('${fontUrl(file)}') format('woff2');
        font-weight: ${weight};
        font-style: ${style};
        font-display: swap;
      }
    `
    );

    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-prefkeeper-fonts', '');
    styleTag.textContent = rules.join('\n');
    document.head.appendChild(styleTag);
  } catch (err) {
    console.warn(
      'PrefKeeper: could not load Atkinson Hyperlegible Next, falling back to system font.',
      err
    );
  }
}

export { FONT_FAMILY };
