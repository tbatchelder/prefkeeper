// scripts/copy-assets.mjs

/**
 * Copies src/assets/ to a top-level assets/ folder, a SIBLING of
 * dist/, not nested inside it. This matters: fonts.js's relative path
 * ('../assets/fonts/X.woff2') is written as "one level up from
 * wherever this bundled file ends up." Both src/index.js and
 * dist/index.js sit one level below the package root, so the same
 * relative path correctly reaches a top-level assets/ folder in
 * either case — verified against Node's URL class, matching the
 * WHATWG spec browsers implement.
 *
 * ALSO copies src/ui/panel.css into dist/panel.css. tsup only bundles
 * JAVASCRIPT — it has no idea panel.css exists at all, so without this
 * step the panel's own styling (tabs, overlay positioning, sliders,
 * everything) was silently absent from every published package. Found
 * by testing the actual published tarball as a real outside consumer
 * would — every one of our own examples/dev testing linked panel.css
 * straight from src/ui/, which bypasses the packaging pipeline
 * entirely and never would have caught this.
 *
 * panel.css is deliberately copied to dist/, NOT into a developer's
 * own project the way prefkeeper-root.css is (see scripts/setup.mjs).
 * It's the tool's own chrome, not something meant to be hand-edited —
 * developers reference it directly from node_modules, same as linking
 * any other library's own CSS file, so it stays current automatically
 * whenever they update the package.
 *
 * Runs automatically after `npm run build` via npm's postbuild
 * lifecycle hook (no separate script needs to call this directly).
 */
import { cpSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcAssetsDir = join(__dirname, '..', 'src', 'assets');
const destAssetsDir = join(__dirname, '..', 'assets');
const srcPanelCss = join(__dirname, '..', 'src', 'ui', 'panel.css');
const destPanelCss = join(__dirname, '..', 'dist', 'panel.css');

if (!existsSync(srcAssetsDir)) {
  console.warn(`copy-assets: no src/assets directory found at ${srcAssetsDir}, skipping.`);
} else {
  if (existsSync(destAssetsDir)) {
    rmSync(destAssetsDir, { recursive: true, force: true });
  }
  cpSync(srcAssetsDir, destAssetsDir, { recursive: true });
  console.log(`copy-assets: copied ${srcAssetsDir} -> ${destAssetsDir}`);
}

if (!existsSync(srcPanelCss)) {
  console.warn(`copy-assets: no panel.css found at ${srcPanelCss}, skipping.`);
} else {
  copyFileSync(srcPanelCss, destPanelCss);
  console.log(`copy-assets: copied ${srcPanelCss} -> ${destPanelCss}`);
}
