import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildRootCss, runSetup } from '../scripts/setup.mjs';

/**
 * Genuine integration-style tests against real temp directories, not
 * mocks -- matching this project's established preference for real
 * verification (see e.g. storage.test.js's localStorage stub, which
 * still exercises real localStorage.getItem/setItem, not a fake).
 * runSetup() takes its paths as parameters specifically so this is
 * possible without touching the real filesystem outside a scratch area.
 */

let scratchDir, sourceFontsDir, sourcePanelCss, targetDir;

beforeEach(() => {
  scratchDir = mkdtempSync(join(tmpdir(), 'prefkeeper-setup-test-'));
  sourceFontsDir = join(scratchDir, 'source-assets', 'fonts');
  sourcePanelCss = join(scratchDir, 'source-dist', 'panel.css');
  targetDir = join(scratchDir, 'consumer-project', 'prefkeeper');

  mkdirSync(sourceFontsDir, { recursive: true });
  mkdirSync(join(scratchDir, 'source-dist'), { recursive: true });
  writeFileSync(join(sourceFontsDir, 'AtkinsonHyperlegibleNext-Regular.woff2'), 'fake font bytes');
  writeFileSync(join(sourceFontsDir, 'OFL.txt'), 'fake license text');
  writeFileSync(sourcePanelCss, '.pk-app { color: red; }');
});

afterEach(() => {
  rmSync(scratchDir, { recursive: true, force: true });
});

describe('buildRootCss', () => {
  it('includes all 14 weight/style @font-face combinations', () => {
    const css = buildRootCss();
    const count = (css.match(/@font-face/g) || []).length;
    expect(count).toBe(14);
  });

  it('includes the full weight range, both normal and italic', () => {
    const css = buildRootCss();
    [200, 300, 400, 500, 600, 700, 800].forEach(weight => {
      expect(css).toContain(`font-weight: ${weight};`);
    });
    expect(css).toContain('font-style: normal;');
    expect(css).toContain('font-style: italic;');
  });

  it('matches tokens.js default color/text/motion/focus values exactly', () => {
    const css = buildRootCss();
    expect(css).toContain('--pk-background: hsl(0, 0%, 100%);');
    expect(css).toContain('--pk-primary: hsl(210, 80%, 50%);');
    expect(css).toContain('--pk-font-size: 100%;');
    expect(css).toContain('--pk-reduce-motion: 1;');
    expect(css).toContain('--pk-focus-outline-width: 3px;');
  });

  it("does NOT set --pk-font-family, so a developer's own font rules apply until Atkinson is chosen", () => {
    const css = buildRootCss();
    expect(css).not.toMatch(/^\s*--pk-font-family:/m);
  });
});

describe('runSetup', () => {
  it('fails cleanly when the bundled source files are missing', () => {
    const result = runSetup({
      sourceFontsDir: join(scratchDir, 'does-not-exist'),
      sourcePanelCss,
      targetDir
    });
    expect(result.ok).toBe(false);
    expect(existsSync(targetDir)).toBe(false);
  });

  it('on a fresh run, creates fonts/, prefkeeper-root.css, and panel.css', () => {
    const result = runSetup({ sourceFontsDir, sourcePanelCss, targetDir });

    expect(result.ok).toBe(true);
    expect(result.alreadySetUp).toBe(false);
    expect(existsSync(join(targetDir, 'fonts', 'AtkinsonHyperlegibleNext-Regular.woff2'))).toBe(
      true
    );
    expect(existsSync(join(targetDir, 'fonts', 'OFL.txt'))).toBe(true);
    expect(existsSync(join(targetDir, 'prefkeeper-root.css'))).toBe(true);
    expect(existsSync(join(targetDir, 'panel.css'))).toBe(true);
  });

  it('copies font files with real, correct content (not empty placeholders)', () => {
    runSetup({ sourceFontsDir, sourcePanelCss, targetDir });
    const copied = readFileSync(
      join(targetDir, 'fonts', 'AtkinsonHyperlegibleNext-Regular.woff2'),
      'utf8'
    );
    expect(copied).toBe('fake font bytes');
  });

  it('REGRESSION: a second run preserves hand-edited prefkeeper-root.css', () => {
    runSetup({ sourceFontsDir, sourcePanelCss, targetDir });
    const rootCssPath = join(targetDir, 'prefkeeper-root.css');
    writeFileSync(rootCssPath, readFileSync(rootCssPath, 'utf8') + '\n/* MY CUSTOM EDIT */');

    const result = runSetup({ sourceFontsDir, sourcePanelCss, targetDir });

    expect(result.alreadySetUp).toBe(true);
    expect(readFileSync(rootCssPath, 'utf8')).toContain('MY CUSTOM EDIT');
  });

  it('REGRESSION: a second run still refreshes panel.css, even though the folder already exists', () => {
    runSetup({ sourceFontsDir, sourcePanelCss, targetDir });

    // Simulate `npm update prefkeeper` shipping a new panel.css
    writeFileSync(sourcePanelCss, '.pk-app { color: blue; /* v2 */ }');
    const result = runSetup({ sourceFontsDir, sourcePanelCss, targetDir });

    expect(result.alreadySetUp).toBe(true);
    const panelCss = readFileSync(join(targetDir, 'panel.css'), 'utf8');
    expect(panelCss).toContain('blue');
    expect(panelCss).toContain('v2');
  });

  it('does not touch fonts/ at all on a second run', () => {
    runSetup({ sourceFontsDir, sourcePanelCss, targetDir });
    writeFileSync(
      join(sourceFontsDir, 'AtkinsonHyperlegibleNext-Regular.woff2'),
      'CHANGED FONT BYTES'
    );

    runSetup({ sourceFontsDir, sourcePanelCss, targetDir });

    const copied = readFileSync(
      join(targetDir, 'fonts', 'AtkinsonHyperlegibleNext-Regular.woff2'),
      'utf8'
    );
    expect(copied).toBe('fake font bytes'); // still the ORIGINAL content, untouched
  });
});
