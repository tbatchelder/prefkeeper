# PrefKeeper

A drop-in accessibility preference engine. A user sets their color, text,
motion, and focus preferences once — on your site, using their browser —
and PrefKeeper remembers them and applies them automatically on return
visits. No account, no login, no data leaving their device.

You control your site's design entirely. PrefKeeper only ever changes
_presentation_ — color, text sizing, motion, focus indicators — never
markup, semantics, ARIA, or alt text. That stays your responsibility as
the developer, same as it always has been.

## Why

Most accessibility color/theme tools either force one designer's idea of
"accessible" on every visitor, or require a paid, hosted overlay service.
PrefKeeper is neither: it's a free, open-source library that puts the
choice in the visitor's hands — presets to get close, sliders to fine-tune
exactly.

## Install

```bash
npm install prefkeeper
```

## Quick start

```js
import { initPrefKeeper } from 'prefkeeper';

document.getElementById('open-preferences-btn').addEventListener('click', () => {
  initPrefKeeper();
});
```

That's it — calling `initPrefKeeper()` mounts the preference panel as a
full-screen overlay, and on your visitor's next page load, PrefKeeper
automatically re-applies whatever they last saved.

### Making your site respond to it

PrefKeeper works by setting CSS custom properties on `document.documentElement`.
Your own CSS just needs to reference them:

```css
body {
  background: var(--pk-background, #ffffff);
  color: var(--pk-text, #222222);
  font-family: var(--pk-font-family, Arial, sans-serif);
  font-size: var(--pk-font-size, 100%);
  line-height: var(--pk-line-height, 1.5);
}

a {
  color: var(--pk-link, #0645ad);
}

.your-button {
  background: var(--pk-primary, #0066cc);
  color: var(--pk-on-primary, #ffffff);
  transition: transform calc(var(--pk-reduce-motion, 1) * 0.3s) ease;
}

.your-button:focus {
  outline-color: var(--pk-focus-outline-color, hsl(200, 100%, 50%));
  outline-width: var(--pk-focus-outline-width, 3px);
  outline-style: solid;
}
```

The second value in each `var()` is a fallback, so your site looks
correct even before PrefKeeper has ever run.

See [`examples/vanilla/index.html`](./examples/vanilla/index.html) for a
complete working example.

## What it covers

- **Color** — background, text, links, buttons (background and text
  independently), with presets for high/low contrast, dark/light mode,
  and common color-vision types
- **Text** — size, line height, letter spacing, word spacing, and an
  optional bundled dyslexia/low-vision-friendly font (Atkinson
  Hyperlegible Next)
- **Motion** — a reduced-motion toggle your own CSS transitions can key
  off of
- **Focus** — outline color and width for keyboard navigation

## Custom presets

Add your own presets — or override the built-in ones — without forking
anything:

```js
initPrefKeeper({
  customPresets: {
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
  }
});
```

## Status

Early (v0.x) but functional — the core preference panel, storage,
import/export, and settings are built and tested. Not yet published to
npm. A browser extension (for preferences to follow a visitor across
different sites) and a React wrapper are planned, not yet built.

## License

MIT for the code. The bundled Atkinson Hyperlegible Next font is
licensed separately under the SIL Open Font License — see
[`src/assets/fonts/OFL.txt`](./src/assets/fonts/OFL.txt).
