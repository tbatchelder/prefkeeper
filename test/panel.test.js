// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initPrefKeeper } from '../src/ui/panel.js';

/**
 * IMPORTANT SCOPE NOTE: jsdom gives real DOM structure and real event
 * dispatch, so these tests genuinely exercise panel.js's wiring --
 * tab switching, dirty-state tracking, Save/Reset/Close logic. What
 * they CANNOT verify is visual/layout correctness (whether sliders
 * actually fill available height, whether the overlay is visually
 * centered, etc.) -- jsdom does not do real CSS layout. That's what
 * the manual browser testing already covered, and what Playwright
 * e2e tests would cover later for regression protection.
 */

function q(selector) {
  return document.querySelector(selector);
}

function qAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function fireInput(el, value) {
  el.value = String(value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function fireClick(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/**
 * Several handlers (Save, Close, Clear All) are `async` and await
 * storage calls that are themselves layered (panel.js -> storage/index.js
 * -> the adapter). A click's handler doesn't finish synchronously just
 * because the underlying localStorage call is fast -- anything after
 * an `await` genuinely waits for the microtask queue. A single
 * `await Promise.resolve()` only guarantees ONE microtask hop; setTimeout
 * runs on the macrotask queue, which is only reached after ALL pending
 * microtasks (regardless of how many layers deep) have drained -- the
 * more robust choice here.
 */
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  document.head.querySelectorAll('[data-prefkeeper-fonts]').forEach(el => el.remove());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('initPrefKeeper mounting', () => {
  it('mounts overlay, backdrop, and app into document.body', async () => {
    await initPrefKeeper();
    expect(q('.pk-overlay')).not.toBeNull();
    expect(q('.pk-backdrop')).not.toBeNull();
    expect(q('.pk-app')).not.toBeNull();
  });

  it('always mounts to document.body, ignoring any mountTo option', async () => {
    const customContainer = document.createElement('div');
    customContainer.id = 'not-body';
    document.body.appendChild(customContainer);

    await initPrefKeeper({ mountTo: customContainer });

    expect(customContainer.querySelector('.pk-overlay')).toBeNull();
    expect(document.body.querySelector(':scope > .pk-overlay')).not.toBeNull();
  });
});

describe('preset dropdowns', () => {
  it('populates both selects from preset data, not hardcoded HTML', async () => {
    await initPrefKeeper();
    const contrastOptions = qAll('.pk-contrast-select option');
    const colorVisionOptions = qAll('.pk-colorvision-select option');
    // 1 placeholder + 4 built-in presets each
    expect(contrastOptions.length).toBe(5);
    expect(colorVisionOptions.length).toBe(5);
    expect(contrastOptions[1].textContent).toBe('High contrast');
  });

  it('selecting a contrast preset updates state and clears the color-vision select', async () => {
    await initPrefKeeper();
    const contrastSelect = q('.pk-contrast-select');
    const colorVisionSelect = q('.pk-colorvision-select');
    colorVisionSelect.value = 'deut';

    contrastSelect.value = 'dark';
    contrastSelect.dispatchEvent(new Event('change', { bubbles: true }));

    expect(colorVisionSelect.value).toBe('');
    expect(q('.pk-preview-mode p').textContent).toBe('Color changes not saved.');
  });

  it('CUSTOM PRESETS: a caller-supplied preset shows up as a real dropdown option', async () => {
    const customPresets = {
      contrast: {
        brand: {
          label: 'Acme Corp Brand Colors',
          values: {
            background: { hue: 0, sat: 0, light: 100 },
            text: { hue: 0, sat: 0, light: 10 },
            primary: { hue: 280, sat: 70, light: 45 },
            onPrimary: { hue: 0, sat: 0, light: 100 },
            link: { hue: 280, sat: 70, light: 40 }
          }
        }
      }
    };
    await initPrefKeeper({ customPresets });

    const options = qAll('.pk-contrast-select option');
    const labels = options.map(o => o.textContent);
    expect(labels).toContain('Acme Corp Brand Colors');
    // built-ins are still present alongside the custom one
    expect(labels).toContain('Dark mode');
  });

  it('CUSTOM PRESETS: a custom key with the same name as a built-in overrides it', async () => {
    const customPresets = {
      contrast: {
        dark: {
          label: 'Dark mode (custom override)',
          values: {
            background: { hue: 0, sat: 0, light: 8 },
            text: { hue: 0, sat: 0, light: 96 },
            primary: { hue: 0, sat: 0, light: 96 },
            onPrimary: { hue: 0, sat: 0, light: 8 },
            link: { hue: 0, sat: 0, light: 80 }
          }
        }
      }
    };
    await initPrefKeeper({ customPresets });

    const options = qAll('.pk-contrast-select option');
    const labels = options.map(o => o.textContent);
    // exactly one 'dark' entry, using the overridden label -- not two
    expect(labels.filter(l => l.startsWith('Dark mode')).length).toBe(1);
    expect(labels).toContain('Dark mode (custom override)');
  });
});

describe('tab switching', () => {
  it('Colors tab is active and visible by default', async () => {
    await initPrefKeeper();
    const colorsTab = q('.pk-tab[data-panel="colors"]');
    const colorsPanel = q('main[data-panel="colors"]');
    expect(colorsTab.classList.contains('pk-active')).toBe(true);
    expect(colorsPanel.hidden).toBe(false);
  });

  it('clicking Text tab activates it and hides Colors', async () => {
    await initPrefKeeper();
    fireClick(q('.pk-tab[data-panel="text"]'));

    expect(q('.pk-tab[data-panel="text"]').classList.contains('pk-active')).toBe(true);
    expect(q('.pk-tab[data-panel="colors"]').classList.contains('pk-active')).toBe(false);
    expect(q('main[data-panel="text"]').hidden).toBe(false);
    expect(q('main[data-panel="colors"]').hidden).toBe(true);
  });

  it('Reset button label follows the active tab', async () => {
    await initPrefKeeper();
    expect(q('.pk-reset-label').textContent).toBe('Reset Colors');
    fireClick(q('.pk-tab[data-panel="motion"]'));
    expect(q('.pk-reset-label').textContent).toBe('Reset Motion');
  });
});

describe('dirty-state tracking', () => {
  it('starts saved (no pending changes) on a fresh load', async () => {
    await initPrefKeeper();
    const status = q('.pk-preview-mode strong');
    expect(status.textContent).toBe('Saved');
  });

  it('moving a color slider marks the app dirty, naming the changed category', async () => {
    await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 200);

    const status = q('.pk-preview-mode strong');
    const text = q('.pk-preview-mode p');
    expect(status.textContent).toBe('Preview Mode');
    expect(text.textContent).toBe('Color changes not saved.');
  });

  it('Save clears the dirty state', async () => {
    await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 200);
    fireClick(q('.pk-save-btn'));
    await flushPromises();

    expect(q('.pk-preview-mode strong').textContent).toBe('Saved');
  });

  it('changing more than one category lists both in the shared status message', async () => {
    await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 200);
    fireClick(q('.pk-tab[data-panel="motion"]'));
    fireClick(q('.pk-reduce-motion-toggle'));

    const text = q('.pk-preview-mode p');
    expect(text.textContent).toBe('Color and Motion changes not saved.');
  });
});

describe('Save persists to storage but does not touch the real page', () => {
  it('Save writes the current colors to localStorage', async () => {
    await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 123);
    fireClick(q('.pk-save-btn'));

    const saved = JSON.parse(localStorage.getItem('prefkeeper-preferences'));
    expect(saved.colors.background.hue).toBe(123);
  });

  it('Save alone does not push a new edit to document.documentElement (only Close does)', async () => {
    await initPrefKeeper();
    // initPrefKeeper() itself applies whatever was already saved (the
    // defaults, on a fresh load) to the real page immediately on mount --
    // that's intentional, so a returning page reflects prior choices.
    // The baseline capture below accounts for that; what we're actually
    // checking is that Save does NOT push the NEW edited value there too.
    const baseline = document.documentElement.style.getPropertyValue('--pk-background');

    fireInput(q('.pk-color-slider'), 123);
    fireClick(q('.pk-save-btn'));
    await flushPromises();

    expect(document.documentElement.style.getPropertyValue('--pk-background')).toBe(baseline);
    expect(document.documentElement.style.getPropertyValue('--pk-background')).not.toContain('123');
  });
});

describe('Reset', () => {
  it('reverts the active category back to its defaults and marks it dirty again', async () => {
    await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 200);
    fireClick(q('.pk-save-btn'));
    await flushPromises();
    expect(q('.pk-preview-mode strong').textContent).toBe('Saved');

    fireClick(q('.pk-reset-btn'));

    expect(q('.pk-color-slider').value).not.toBe('200');
    expect(q('.pk-preview-mode strong').textContent).toBe('Preview Mode');
  });
});

describe('Close', () => {
  it('closes immediately when there are no unsaved changes', async () => {
    const { container } = await initPrefKeeper();
    fireClick(q('.pk-close-btn'));
    await flushPromises();
    expect(container.style.display).toBe('none');
  });

  it('prompts to save when there are unsaved changes; Cancel keeps the panel open', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    );
    const { container } = await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 200);

    fireClick(q('.pk-close-btn'));
    await flushPromises();

    expect(confirm).toHaveBeenCalled();
    expect(container.style.display).not.toBe('none');
  });

  it('confirming the prompt saves and then closes, and applies the saved state to the real page', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    const { container } = await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 77);

    fireClick(q('.pk-close-btn'));
    await flushPromises();

    expect(container.style.display).toBe('none');
    const saved = JSON.parse(localStorage.getItem('prefkeeper-preferences'));
    expect(saved.colors.background.hue).toBe(77);
    expect(document.documentElement.style.getPropertyValue('--pk-background')).toContain('77');
  });

  it('REGRESSION: clicking the backdrop does NOT close the panel', async () => {
    const { container } = await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 200); // unsaved change present

    fireClick(q('.pk-backdrop'));
    await flushPromises();

    expect(container.style.display).not.toBe('none');
  });
});

describe('hamburger menu', () => {
  it('opens on click and closes when clicking elsewhere in the document', async () => {
    await initPrefKeeper();
    const menu = q('.pk-hamburger-menu');
    expect(menu.hidden).toBe(true);

    fireClick(q('.pk-hamburger-btn'));
    expect(menu.hidden).toBe(false);

    fireClick(document.body);
    expect(menu.hidden).toBe(true);
  });

  it('Clear All Saved Preferences requires confirmation and resets to defaults', async () => {
    await initPrefKeeper();
    fireInput(q('.pk-color-slider'), 200);
    fireClick(q('.pk-save-btn'));
    await flushPromises();

    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    fireClick(q('.pk-hamburger-btn'));
    fireClick(q('.pk-menu-clear'));
    await flushPromises();

    expect(localStorage.getItem('prefkeeper-preferences')).toBeNull();
    expect(q('.pk-preview-mode strong').textContent).toBe('Saved');
  });
});

describe('hamburger screens (overlay-on-overlay)', () => {
  it('Help opens the full-app-covering screen with content, Back closes it', async () => {
    await initPrefKeeper();
    fireClick(q('.pk-hamburger-btn'));
    fireClick(q('.pk-menu-help'));

    expect(q('.pk-hamburger-screen').hidden).toBe(false);
    expect(q('.pk-hamburger-screen-content').textContent).toContain('Help');

    fireClick(q('.pk-hamburger-back-btn'));
    expect(q('.pk-hamburger-screen').hidden).toBe(true);
  });

  describe('Export', () => {
    it('pre-fills the textarea with the current state as JSON', async () => {
      await initPrefKeeper();
      fireInput(q('.pk-color-slider'), 55);
      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-export'));

      const output = q('.pk-export-output');
      const parsed = JSON.parse(output.value);
      expect(parsed.colors.background.hue).toBe(55);
    });

    it('Copy All writes the textarea contents to the clipboard', async () => {
      const writeText = vi.fn();
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

      await initPrefKeeper();
      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-export'));
      fireClick(q('.pk-export-copy'));

      expect(writeText).toHaveBeenCalledWith(q('.pk-export-output').value);
    });
  });

  describe('Import', () => {
    it('applies valid imported JSON and marks all four categories dirty', async () => {
      await initPrefKeeper();
      const validJson = JSON.stringify({
        colors: {
          background: { hue: 1, sat: 1, light: 1 },
          text: { hue: 2, sat: 2, light: 2 },
          primary: { hue: 3, sat: 3, light: 3 },
          onPrimary: { hue: 4, sat: 4, light: 4 },
          link: { hue: 5, sat: 5, light: 5 }
        },
        text: {
          fontSize: 110,
          lineHeight: 1.6,
          letterSpacing: 1,
          wordSpacing: 1,
          fontFamily: 'site'
        },
        motion: { reduceMotion: true },
        focus: { outlineColor: { hue: 6, sat: 6, light: 6 }, outlineWidth: 4 }
      });

      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-import'));
      q('.pk-import-input').value = validJson;
      fireClick(q('.pk-import-apply'));

      expect(q('.pk-hamburger-screen').hidden).toBe(true);
      expect(q('.pk-color-slider').value).toBe('1');
      expect(q('.pk-preview-mode p').textContent).toBe(
        'Color, Text, Motion and Focus changes not saved.'
      );
    });

    it('shows an inline error and does not apply anything on invalid JSON', async () => {
      await initPrefKeeper();
      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-import'));
      q('.pk-import-input').value = '{not valid json';
      fireClick(q('.pk-import-apply'));

      expect(q('.pk-hamburger-screen').hidden).toBe(false); // stays open
      const errorEl = q('.pk-import-error');
      expect(errorEl.hidden).toBe(false);
      expect(errorEl.textContent).toMatch(/valid JSON/);
      expect(q('.pk-preview-mode strong').textContent).toBe('Saved'); // nothing marked dirty
    });

    it('warns before overwriting when there are unsaved changes', async () => {
      const confirmMock = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmMock);

      await initPrefKeeper();
      fireInput(q('.pk-color-slider'), 200); // unsaved change present

      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-import'));
      q('.pk-import-input').value = '{}';
      fireClick(q('.pk-import-apply'));

      expect(confirmMock).toHaveBeenCalled();
      // Cancelled -- original unsaved slider value should remain untouched
      expect(q('.pk-color-slider').value).toBe('200');
    });
  });

  describe('Settings and Pause (shared boolean)', () => {
    it('Settings checkbox starts checked (auto-load on) by default', async () => {
      await initPrefKeeper();
      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-settings'));

      expect(q('.pk-auto-load-toggle').checked).toBe(true);
    });

    it('unchecking the Settings toggle persists autoLoadPaused and updates the Pause label', async () => {
      await initPrefKeeper();
      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-settings'));
      const toggle = q('.pk-auto-load-toggle');
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
      await flushPromises();

      const saved = JSON.parse(localStorage.getItem('prefkeeper-settings'));
      expect(saved.autoLoadPaused).toBe(true);

      fireClick(q('.pk-hamburger-back-btn'));
      fireClick(q('.pk-hamburger-btn'));
      expect(q('.pk-pause-label').textContent).toBe('Resume Auto-Load');
    });

    it('the Pause menu item toggles the same boolean the Settings checkbox uses', async () => {
      await initPrefKeeper();
      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-pause'));
      await flushPromises();

      const saved = JSON.parse(localStorage.getItem('prefkeeper-settings'));
      expect(saved.autoLoadPaused).toBe(true);

      fireClick(q('.pk-hamburger-btn'));
      fireClick(q('.pk-menu-settings'));
      expect(q('.pk-auto-load-toggle').checked).toBe(false);
    });

    it('REGRESSION: when paused, Close does not apply state to the real page', async () => {
      localStorage.setItem('prefkeeper-settings', JSON.stringify({ autoLoadPaused: true }));

      await initPrefKeeper();
      // Even the initial mount-time apply should be skipped while paused
      expect(document.documentElement.style.getPropertyValue('--pk-background')).toBe('');

      fireClick(q('.pk-close-btn'));
      await flushPromises();
      expect(document.documentElement.style.getPropertyValue('--pk-background')).toBe('');
    });
  });
});
