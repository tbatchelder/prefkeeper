/**
 * panel.js
 *
 * Builds the PrefKeeper panel at runtime and wires it to the rest of
 * the library. Key architectural points, carried over from the
 * CodePen prototype but made real here:
 *
 * - No static HTML file. There's no page of our own to put markup in —
 *   this constructs the DOM via a template string parsed into real
 *   elements, then inserts it into whatever host page calls
 *   initPrefKeeper().
 *
 * - Every query is scoped to the panel's own container, never
 *   `document.querySelector` directly. Dropping into an arbitrary
 *   host page means we can't assume our classes/ids are unique in
 *   the wider document — only within our own container.
 *
 * - No duplicate color-math or contrast-math here. applyColors/
 *   applyText/applyMotion/applyFocus from core/engine.js, and
 *   rateTokenContrast from core/contrast.js, are reused for BOTH the
 *   internal preview panels and the real host page — engine.js's
 *   `target` parameter is what makes that possible.
 *
 * - Track 1 / Track 2 separation, preserved exactly as designed:
 *     Track 1 (internal working state) — sliders, presets, Reset —
 *       only ever touches the in-memory `state` object and this
 *       panel's own preview elements.
 *     Track 2 (the real host page) — only ever touched by Save
 *       (persists state to storage) and Close (reads storage, then
 *       calls engine.applyState against document.documentElement).
 *   Nothing in Track 1 ever calls engine functions against
 *   document.documentElement directly.
 */

import { colorDefaults, textDefaults, motionDefaults, focusDefaults } from '../core/tokens.js';
import { applyColors, applyText, applyMotion, applyFocus, applyState } from '../core/engine.js';
import { rateTokenContrast } from '../core/contrast.js';
import * as storage from '../storage/index.js';
import { injectFontFaces } from './fonts.js';
import { CONTRAST_PRESETS as DEFAULT_CONTRAST_PRESETS } from '../presets/contrast.js';
import { COLOR_VISION_PRESETS as DEFAULT_COLOR_VISION_PRESETS } from '../presets/colorblind.js';
import { el } from '../utils/dom.js';

// NOTE: the actual preset DATA (High Contrast, Dark Mode, Deuteranopia,
// etc.) now lives in src/presets/ -- not here. This file only imports
// it and merges it with any customPresets an initPrefKeeper() caller
// supplies (see initPrefKeeper below). This is what lets a company
// (or any developer) layer in their own preset -- possibly private,
// never published in this open-source package -- without forking or
// touching panel.js at all.

const TARGET_LABELS = {
  background: 'Background',
  text: 'Text',
  primary: 'Buttons',
  onPrimary: 'Button Text',
  link: 'Links'
};

const CATEGORY_LABELS = {
  colors: 'Color',
  text: 'Text',
  motion: 'Motion',
  focus: 'Focus'
};

/**
 * Appends one <option> per preset key to a <select>, using each
 * preset's own `label`. This is what makes custom presets show up as
 * real, selectable dropdown entries -- the select's placeholder
 * option (value="") is left untouched; everything else is generated
 * from whichever preset set is actually active for this instance.
 */
function populateSelect(selectEl, presets) {
  Object.entries(presets).forEach(([key, preset]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = preset.label;
    selectEl.appendChild(option);
  });
}

function buildTemplate() {
  return `
    <div class="pk-overlay">
      <div class="pk-backdrop"></div>
      <div class="pk-app">
        <header class="pk-tabs">
          <div class="pk-tab-group">
            <button class="pk-tab pk-active" data-panel="colors" type="button">Colors</button>
            <button class="pk-tab" data-panel="text" type="button">Text</button>
          <button class="pk-tab" data-panel="motion" type="button">Motion</button>
          <button class="pk-tab" data-panel="focus" type="button">Focus</button>
        </div>
        <div class="pk-icon-group">
          <button class="pk-icon-btn pk-hamburger-btn" aria-label="Menu" aria-haspopup="true" aria-expanded="false" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button class="pk-icon-btn pk-close-btn" aria-label="Close" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </header>

      <div class="pk-hamburger-menu" hidden>
        <button class="pk-menu-item pk-menu-import" type="button">Import</button>
        <button class="pk-menu-item pk-menu-export" type="button">Export</button>
        <button class="pk-menu-item pk-menu-help" type="button">Help</button>
        <div class="pk-menu-divider"></div>
        <button class="pk-menu-item pk-menu-settings" type="button">Settings</button>
        <button class="pk-menu-item pk-menu-pause" type="button">
          <span class="pk-pause-label">Pause Auto-Load</span>
        </button>
        <div class="pk-menu-divider"></div>
        <button class="pk-menu-item pk-menu-item-danger pk-menu-clear" type="button">Clear All Saved Preferences</button>
      </div>

      <div class="pk-settings-panel" hidden>
        <h3>Settings</h3>
        <label class="pk-settings-row">
          <input type="checkbox" class="pk-auto-load-toggle" checked>
          Auto-load my preferences on every page
        </label>
        <button class="pk-footer-btn pk-settings-close-btn" type="button">Done</button>
      </div>

      <main class="pk-content" data-panel="colors">
        <section class="pk-preview-panel">
          <div class="pk-preset-selects">
            <select class="pk-contrast-select">
              <option value="">Display mode: default</option>
            </select>
            <select class="pk-colorvision-select">
              <option value="">Color vision: none selected</option>
            </select>
          </div>
          <div class="pk-preview">
            <h2>Preview Heading</h2>
            <p>This is sample body text used to preview readability and contrast.</p>
            <a href="#" class="pk-preview-link" onclick="return false;">Sample Link</a>
            <button class="pk-primary-btn" type="button">Primary Button</button>
            <button class="pk-secondary-btn" type="button">Secondary Button</button>
            <input type="text" placeholder="Sample Input">
            <div class="pk-success">Success Message</div>
            <div class="pk-warning">Warning Message</div>
          </div>
        </section>
        <aside class="pk-controls">
          <div class="pk-control-status">
            <div class="pk-preview-mode">
              <strong>Preview Mode</strong>
              <p>Changes are not saved.</p>
            </div>
            <div class="pk-editing">
              <select class="pk-target-select">
                <option value="background">Background</option>
                <option value="text">Text</option>
                <option value="primary">Buttons</option>
                <option value="onPrimary">Button Text</option>
                <option value="link">Links</option>
              </select>
            </div>
            <div class="pk-adjusting">Adjusting: <span class="pk-adjusting-text">Background</span></div>
          </div>
          <div class="pk-sliders">
            <div class="pk-slider-group">
              <span class="pk-slider-icon">&#127752;</span>
              <input class="pk-vertical-slider pk-color-track pk-color-slider" type="range" min="0" max="360" value="0">
            </div>
            <div class="pk-slider-group">
              <span class="pk-slider-icon">&#128280;</span>
              <input class="pk-vertical-slider pk-intensity-slider" type="range" min="0" max="100" value="0">
            </div>
            <div class="pk-slider-group">
              <span class="pk-slider-icon">&#9728;</span>
              <input class="pk-vertical-slider pk-brightness-slider" type="range" min="0" max="100" value="100">
            </div>
          </div>
          <div class="pk-calculations">
            <span class="pk-contrast-badge"></span>
          </div>
        </aside>
      </main>

      <main class="pk-content" data-panel="text" hidden>
        <section class="pk-preview-panel">
          <div class="pk-preview">
            <h2>Preview Heading</h2>
            <p>This is sample body text used to preview readability as size, spacing, and font change.</p>
            <a href="#" class="pk-preview-link" onclick="return false;">Sample Link</a>
            <button class="pk-primary-btn" type="button">Primary Button</button>
          </div>
        </section>
        <aside class="pk-controls">
          <div class="pk-control-status">
            <div class="pk-preview-mode">
              <strong>Preview Mode</strong>
              <p>Changes are not saved.</p>
            </div>
          </div>
          <div class="pk-text-controls">
            <div class="pk-text-slider-row">
              <label>Font size <span class="pk-font-size-out">100%</span></label>
              <input class="pk-font-size-slider" type="range" min="80" max="200" value="100" step="5">
            </div>
            <div class="pk-text-slider-row">
              <label>Line spacing <span class="pk-line-height-out">1.5</span></label>
              <input class="pk-line-height-slider" type="range" min="10" max="30" value="15" step="1">
            </div>
            <div class="pk-text-slider-row">
              <label>Letter spacing <span class="pk-letter-spacing-out">0px</span></label>
              <input class="pk-letter-spacing-slider" type="range" min="0" max="6" value="0" step="0.5">
            </div>
            <div class="pk-text-slider-row">
              <label>Word spacing <span class="pk-word-spacing-out">0px</span></label>
              <input class="pk-word-spacing-slider" type="range" min="0" max="16" value="0" step="1">
            </div>
            <div class="pk-font-choice">
              <p class="pk-font-choice-label">Choose a font for this site's text</p>
              <div class="pk-font-options">
                <label class="pk-font-option">
                  <input type="radio" name="pk-font-choice" value="site" checked>
                  <span class="pk-font-sample" style="font-family: Arial, sans-serif;">Site font &mdash; The quick brown fox jumps.</span>
                </label>
                <label class="pk-font-option">
                  <input type="radio" name="pk-font-choice" value="atkinson">
                  <span class="pk-font-sample" style="font-family: 'Atkinson Hyperlegible Next', sans-serif;">Atkinson Hyperlegible Next &mdash; The quick brown fox jumps.</span>
                </label>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <main class="pk-content" data-panel="motion" hidden>
        <section class="pk-preview-panel">
          <div class="pk-preview">
            <h2>Preview Heading</h2>
            <p>This text and these elements will animate briefly so you can see the difference.</p>
            <button class="pk-primary-btn" type="button">Hover or click me</button>
          </div>
        </section>
        <aside class="pk-controls">
          <div class="pk-control-status">
            <div class="pk-preview-mode">
              <strong>Preview Mode</strong>
              <p>Changes are not saved.</p>
            </div>
          </div>
          <div class="pk-motion-toggle">
            <label>
              <input type="checkbox" class="pk-reduce-motion-toggle">
              Reduce motion
            </label>
            <p class="pk-motion-hint">Turns off animations and transitions across the site.</p>
          </div>
        </aside>
      </main>

      <main class="pk-content" data-panel="focus" hidden>
        <section class="pk-preview-panel">
          <div class="pk-preview">
            <h2>Preview Heading</h2>
            <p>Click into the input below to see your focus outline.</p>
            <input type="text" class="pk-focus-demo" placeholder="Click here">
            <button class="pk-primary-btn pk-focus-demo" type="button">Or click this button</button>
          </div>
        </section>
        <aside class="pk-controls">
          <div class="pk-control-status">
            <div class="pk-preview-mode">
              <strong>Preview Mode</strong>
              <p>Changes are not saved.</p>
            </div>
          </div>
          <div class="pk-sliders">
            <div class="pk-slider-group">
              <span class="pk-slider-icon">&#127752;</span>
              <input class="pk-vertical-slider pk-color-track pk-focus-color-slider" type="range" min="0" max="360" value="200">
            </div>
          </div>
          <div class="pk-focus-width">
            <label>Outline width</label>
            <input class="pk-focus-width-slider" type="range" min="1" max="6" value="3">
          </div>
        </aside>
      </main>

      <footer class="pk-app-footer">
        <div class="pk-footer-left">
          <button class="pk-footer-btn pk-save-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
          <button class="pk-footer-btn pk-reset-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span class="pk-reset-label">Reset Colors</span>
          </button>
        </div>
        <button class="pk-footer-btn pk-view-toggle" type="button">View Site Default</button>
        </footer>
      </div>
    </div>
  `;
}

/**
 * Mounts the PrefKeeper panel into the page and wires it up.
 * @param {Object} [options]
 * @returns {Promise<{ container: Element, close: Function }>}
 */
export async function initPrefKeeper(options = {}) {
  injectFontFaces();

  // Always appended directly to document.body, regardless of any
  // mountTo the caller passes — position:fixed only reliably covers
  // the whole viewport if nothing between it and the page root has
  // its own transform/filter/perspective (which creates a new
  // containing block for fixed-position elements). Nesting inside an
  // arbitrary host-page container risks silently breaking that. This
  // is the same reason serious modal/overlay libraries always attach
  // to body rather than wherever they were triggered from.
  const container = el(buildTemplate());
  document.body.appendChild(container);

  // Merge any caller-supplied custom presets with the built-in
  // defaults. A custom key with the same name as a built-in one
  // (e.g. redefining 'dark') overrides it; any other key is added
  // alongside. This is the actual extension point that lets a
  // company's own private preset (never published in this
  // open-source package) get used without forking panel.js --
  // initPrefKeeper({ customPresets: { contrast: {...}, colorVision: {...} } }).
  const contrastPresets = {
    ...DEFAULT_CONTRAST_PRESETS,
    ...(options.customPresets?.contrast || {})
  };
  const colorVisionPresets = {
    ...DEFAULT_COLOR_VISION_PRESETS,
    ...(options.customPresets?.colorVision || {})
  };

  // ---- Working state (Track 1) ----
  // Starts from whatever's already saved, NOT hardcoded defaults, so
  // reopening the panel reflects prior choices instead of resetting
  // the visible controls every time.
  const state = await storage.get();
  const dirtyCategories = new Set();

  // ---- Scoped element refs (container-scoped, never document.*) ----
  const q = selector => container.querySelector(selector);
  const qa = selector => Array.from(container.querySelectorAll(selector));

  const tabs = qa('.pk-tab');
  const panels = qa('.pk-content');
  const resetBtn = q('.pk-reset-btn');
  const resetLabel = q('.pk-reset-label');

  const colorPreview = q('main[data-panel="colors"] .pk-preview');
  const contrastSelect = q('.pk-contrast-select');
  const colorVisionSelect = q('.pk-colorvision-select');
  populateSelect(contrastSelect, contrastPresets);
  populateSelect(colorVisionSelect, colorVisionPresets);
  const targetSelect = q('.pk-target-select');
  const adjustingText = q('.pk-adjusting-text');
  const colorSlider = q('.pk-color-slider');
  const intensitySlider = q('.pk-intensity-slider');
  const brightnessSlider = q('.pk-brightness-slider');
  const contrastBadge = q('.pk-contrast-badge');

  const textPreview = q('main[data-panel="text"] .pk-preview');
  const fontSizeSlider = q('.pk-font-size-slider');
  const lineHeightSlider = q('.pk-line-height-slider');
  const letterSpacingSlider = q('.pk-letter-spacing-slider');
  const wordSpacingSlider = q('.pk-word-spacing-slider');
  const fontChoiceInputs = qa('input[name="pk-font-choice"]');

  const motionPreview = q('main[data-panel="motion"] .pk-preview');
  const reduceMotionToggle = q('.pk-reduce-motion-toggle');

  const focusPreview = q('main[data-panel="focus"] .pk-preview');
  const focusColorSlider = q('.pk-focus-color-slider');
  const focusWidthSlider = q('.pk-focus-width-slider');

  // ---- Combined preview rendering ----
  // Every tab's preview reflects the FULL current working state (all
  // four categories), not just the category that tab edits. Rationale:
  // if someone changes colors specifically because they couldn't read
  // the default scheme, showing them unreadable text the moment they
  // switch to the Text tab would defeat the entire point of the tool —
  // and would look like a bug ("my change didn't take") even though it
  // was working as narrowly designed. This matches what the real host
  // page already does (applyState() always applies everything together)
  // — this just makes the internal previews consistent with that.
  const previewElements = [colorPreview, textPreview, motionPreview, focusPreview];

  function renderAllPreviews() {
    previewElements.forEach(previewEl => {
      applyColors(state.colors, previewEl);
      applyText(state.text, previewEl);
      applyMotion(state.motion, previewEl);
      applyFocus(state.focus, previewEl);
    });
  }

  const hamburgerBtn = q('.pk-hamburger-btn');
  const hamburgerMenu = q('.pk-hamburger-menu');
  const settingsPanel = q('.pk-settings-panel');
  const pauseLabel = q('.pk-pause-label');
  const viewToggleBtn = q('.pk-view-toggle');
  const closeBtn = q('.pk-close-btn');

  // ---- Shared dirty-state, identical wording across all four tabs ----
  function refreshStatus() {
    let title, text;
    if (dirtyCategories.size === 0) {
      title = 'Saved';
      text = 'All changes saved.';
    } else {
      const names = [...dirtyCategories].map(c => CATEGORY_LABELS[c]);
      const joined =
        names.length === 1
          ? names[0]
          : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
      title = 'Preview Mode';
      text = `${joined} changes not saved.`;
    }
    qa('.pk-preview-mode').forEach(block => {
      block.querySelector('strong').textContent = title;
      block.querySelector('p').textContent = text;
    });
  }

  function markCategoryDirty(category) {
    dirtyCategories.add(category);
    refreshStatus();
  }

  function markAllSaved() {
    dirtyCategories.clear();
    refreshStatus();
  }

  // ---- COLORS TAB ----
  function updateSliderThumbAndTrack() {
    const hue = +colorSlider.value;
    const sat = +intensitySlider.value;
    const light = +brightnessSlider.value;
    const thumbColor = `hsl(${hue}, ${sat}%, ${light}%)`;
    [colorSlider, intensitySlider, brightnessSlider].forEach(sl =>
      sl.style.setProperty('--thumb-color', thumbColor)
    );
    intensitySlider.style.setProperty(
      '--track-bg',
      `linear-gradient(to top, hsl(${hue}, 0%, ${light}%), hsl(${hue}, 100%, ${light}%))`
    );
    brightnessSlider.style.setProperty(
      '--track-bg',
      `linear-gradient(to top, hsl(${hue}, ${sat}%, 0%), hsl(${hue}, ${sat}%, 50%), hsl(${hue}, ${sat}%, 100%))`
    );
  }

  function updateContrastBadge() {
    const { level, ratio } = rateTokenContrast(state.colors.text, state.colors.background);
    const labels = {
      excellent: 'Excellent',
      acceptable: 'Acceptable',
      difficult: 'Difficult'
    };
    contrastBadge.textContent = `${labels[level]} \u00B7 ${ratio.toFixed(1)}`;
    contrastBadge.className = `pk-contrast-badge pk-${level}`;
  }

  function loadTargetIntoSliders(target) {
    const t = state.colors[target];
    colorSlider.value = t.hue;
    intensitySlider.value = t.sat;
    brightnessSlider.value = t.light;
    updateSliderThumbAndTrack();
  }

  function renderColors() {
    loadTargetIntoSliders(targetSelect.value);
    updateContrastBadge();
    renderAllPreviews();
  }

  targetSelect.addEventListener('change', () => {
    adjustingText.textContent = TARGET_LABELS[targetSelect.value];
    loadTargetIntoSliders(targetSelect.value);
  });

  [colorSlider, intensitySlider, brightnessSlider].forEach(slider => {
    slider.addEventListener('input', () => {
      const target = targetSelect.value;
      // NOTE (v2 follow-up): once typed/numeric color inputs exist, their
      // values need to be clamped to 0-360/0-100/0-100 the same way a
      // <input type="range"> physically can't go out of bounds. That
      // clamp step belongs here or in a shared sanitize helper — NOT in
      // storage/index.js, which only ever validates shape, never range.
      state.colors[target] = {
        hue: +colorSlider.value,
        sat: +intensitySlider.value,
        light: +brightnessSlider.value
      };
      updateSliderThumbAndTrack();
      updateContrastBadge();
      renderAllPreviews();
      markCategoryDirty('colors');
    });
  });

  function applyColorPreset(preset) {
    state.colors = JSON.parse(JSON.stringify(colorDefaults));
    Object.entries(preset.values).forEach(([target, value]) => {
      state.colors[target] = value;
    });
    const changedTarget = Object.keys(preset.values)[0];
    targetSelect.value = changedTarget;
    adjustingText.textContent = TARGET_LABELS[changedTarget];
    renderColors();
    markCategoryDirty('colors');
  }

  contrastSelect.addEventListener('change', e => {
    if (!e.target.value) return;
    colorVisionSelect.value = '';
    applyColorPreset(contrastPresets[e.target.value]);
  });

  colorVisionSelect.addEventListener('change', e => {
    if (!e.target.value) return;
    contrastSelect.value = '';
    applyColorPreset(colorVisionPresets[e.target.value]);
  });

  // ---- TEXT TAB ----
  function renderText() {
    fontSizeSlider.value = state.text.fontSize;
    lineHeightSlider.value = state.text.lineHeight * 10;
    letterSpacingSlider.value = state.text.letterSpacing;
    wordSpacingSlider.value = state.text.wordSpacing;
    q('.pk-font-size-out').textContent = `${state.text.fontSize}%`;
    q('.pk-line-height-out').textContent = state.text.lineHeight;
    q('.pk-letter-spacing-out').textContent = `${state.text.letterSpacing}px`;
    q('.pk-word-spacing-out').textContent = `${state.text.wordSpacing}px`;
    fontChoiceInputs.forEach(input => {
      input.checked = input.value === state.text.fontFamily;
    });
    renderAllPreviews();
  }

  [fontSizeSlider, lineHeightSlider, letterSpacingSlider, wordSpacingSlider].forEach(slider => {
    slider.addEventListener('input', () => {
      state.text.fontSize = +fontSizeSlider.value;
      state.text.lineHeight = +lineHeightSlider.value / 10;
      state.text.letterSpacing = +letterSpacingSlider.value;
      state.text.wordSpacing = +wordSpacingSlider.value;
      renderText();
      markCategoryDirty('text');
    });
  });

  fontChoiceInputs.forEach(input => {
    input.addEventListener('change', () => {
      state.text.fontFamily = input.value;
      renderText();
      markCategoryDirty('text');
    });
  });

  // ---- MOTION TAB ----
  function renderMotion() {
    reduceMotionToggle.checked = state.motion.reduceMotion;
    renderAllPreviews();
  }

  reduceMotionToggle.addEventListener('change', () => {
    state.motion.reduceMotion = reduceMotionToggle.checked;
    renderMotion();
    markCategoryDirty('motion');
  });

  // ---- FOCUS TAB ----
  function renderFocus() {
    focusColorSlider.value = state.focus.outlineColor.hue;
    focusColorSlider.style.setProperty(
      '--thumb-color',
      `hsl(${state.focus.outlineColor.hue}, 100%, 50%)`
    );
    focusWidthSlider.value = state.focus.outlineWidth;
    renderAllPreviews();
  }

  [focusColorSlider, focusWidthSlider].forEach(slider => {
    slider.addEventListener('input', () => {
      state.focus.outlineColor = {
        hue: +focusColorSlider.value,
        sat: 100,
        light: 50
      };
      state.focus.outlineWidth = +focusWidthSlider.value;
      renderFocus();
      markCategoryDirty('focus');
    });
  });

  // ---- Per-tab Reset, generalized over one shared reset function ----
  const CATEGORY_DEFAULTS = {
    colors: colorDefaults,
    text: textDefaults,
    motion: motionDefaults,
    focus: focusDefaults
  };
  const CATEGORY_RENDERERS = {
    colors: renderColors,
    text: renderText,
    motion: renderMotion,
    focus: renderFocus
  };
  const RESET_LABELS = {
    colors: 'Reset Colors',
    text: 'Reset Text',
    motion: 'Reset Motion',
    focus: 'Reset Focus'
  };

  function resetCategory(category) {
    state[category] = JSON.parse(JSON.stringify(CATEGORY_DEFAULTS[category]));
    CATEGORY_RENDERERS[category]();
    markCategoryDirty(category);
  }

  resetBtn.addEventListener('click', () => {
    const activeTab = q('.pk-tab.pk-active').dataset.panel;
    resetCategory(activeTab);
  });

  // ---- Tab switching ----
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('pk-active'));
      tab.classList.add('pk-active');
      panels.forEach(p => {
        p.hidden = p.dataset.panel !== tab.dataset.panel;
      });
      resetLabel.textContent = RESET_LABELS[tab.dataset.panel];
    });
  });

  // ---- Save (Track 1 -> storage only, never touches the real page) ----
  q('.pk-save-btn').addEventListener('click', async () => {
    await storage.set(state);
    markAllSaved();
  });

  // ---- Hamburger menu ----
  hamburgerBtn.addEventListener('click', () => {
    const isOpen = !hamburgerMenu.hidden;
    hamburgerMenu.hidden = isOpen;
    hamburgerBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', e => {
    if (!hamburgerMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      hamburgerMenu.hidden = true;
    }
  });

  q('.pk-menu-import').addEventListener('click', () => {
    hamburgerMenu.hidden = true; // Import panel: future work
  });
  q('.pk-menu-export').addEventListener('click', () => {
    hamburgerMenu.hidden = true; // Export panel: future work
  });
  q('.pk-menu-help').addEventListener('click', () => {
    hamburgerMenu.hidden = true; // Help content: future work
  });

  q('.pk-menu-settings').addEventListener('click', () => {
    hamburgerMenu.hidden = true;
    settingsPanel.hidden = false;
  });
  q('.pk-settings-close-btn').addEventListener('click', () => {
    settingsPanel.hidden = true;
  });

  let autoLoadPaused = false;
  q('.pk-menu-pause').addEventListener('click', () => {
    autoLoadPaused = !autoLoadPaused;
    pauseLabel.textContent = autoLoadPaused ? 'Resume Auto-Load' : 'Pause Auto-Load';
    // Real implementation (once the extension exists): dispatch a
    // CustomEvent on window that the extension's content script
    // listens for. This page never calls the extension directly —
    // see the mail-slot model from the extension design discussion.
    hamburgerMenu.hidden = true;
  });

  q('.pk-menu-clear').addEventListener('click', async () => {
    const confirmed = confirm(
      "This will permanently erase all your saved preferences and restore this site to its designer's original look. This cannot be undone. Continue?"
    );
    hamburgerMenu.hidden = true;
    if (!confirmed) return;
    await storage.clear();
    Object.keys(CATEGORY_RENDERERS).forEach(category => {
      state[category] = JSON.parse(JSON.stringify(CATEGORY_DEFAULTS[category]));
      CATEGORY_RENDERERS[category]();
    });
    // Counts as an immediately-persisted action, not a pending change —
    // matches the earlier Restore-Site-Default decision. Does NOT touch
    // the real host page yet; that only happens at Close, same as Save.
    markAllSaved();
  });

  // ---- View Site Default toggle (Track 1 only — never touches storage
  // or the real host page, purely flips this panel's own preview) ----
  let viewingSiteDefault = false;
  let savedInlineStyles = null;

  viewToggleBtn.addEventListener('click', () => {
    const affected = qa('.pk-preview, .pk-focus-demo');
    viewingSiteDefault = !viewingSiteDefault;
    if (viewingSiteDefault) {
      savedInlineStyles = new Map();
      affected.forEach(node => savedInlineStyles.set(node, node.getAttribute('style')));
      affected.forEach(node => node.removeAttribute('style'));
      viewToggleBtn.textContent = 'View My Preferences';
    } else {
      affected.forEach(node => {
        const style = savedInlineStyles.get(node);
        if (style) node.setAttribute('style', style);
        else node.removeAttribute('style');
      });
      viewToggleBtn.textContent = 'View Site Default';
    }
  });

  // ---- Close (the ONLY place Track 2 -- the real host page -- gets touched) ----
  async function handleClose() {
    if (dirtyCategories.size > 0) {
      const confirmed = confirm(
        'You have unsaved changes.\n\nClick OK for "Save and Close," or Cancel to keep editing.'
      );
      if (!confirmed) return;
      await storage.set(state);
      markAllSaved();
    }
    const saved = await storage.get();
    applyState(saved, document.documentElement);
    container.style.display = 'none';
  }

  closeBtn.addEventListener('click', handleClose);

  // NOTE: deliberately NOT wiring a backdrop click to close the panel.
  // The X button (with its unsaved-changes check) is the only way to
  // dismiss -- an accidental click just outside the panel while
  // mid-edit shouldn't be able to silently discard someone's changes.

  // ---- Initial paint ----
  renderColors();
  renderText();
  renderMotion();
  renderFocus();
  resetLabel.textContent = RESET_LABELS.colors;
  // Nothing has been edited yet -- sync the status text to reflect
  // that, rather than leaving the template's hardcoded placeholder
  // ("Preview Mode / Changes are not saved") displayed by default.
  markAllSaved();

  // The real host page reflects whatever was already saved, immediately
  // on load -- independent of whether the panel is even opened this visit.
  applyState(state, document.documentElement);

  return {
    container,
    close: () => closeBtn.click()
  };
}
