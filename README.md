# PrefKeeper

![npm version](https://img.shields.io/npm/v/prefkeeper)
![CI](https://github.com/tbatchelder/prefkeeper/actions/workflows/ci.yml/badge.svg)
![license](https://img.shields.io/github/license/tbatchelder/prefkeeper)
![typescript](https://img.shields.io/badge/TypeScript-Ready-blue)
![bundle size](https://img.shields.io/bundlephobia/minzip/prefkeeper)

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
npx prefkeeper-setup
```

That second command creates a `prefkeeper/` folder in your project:

```
prefkeeper/
├── fonts/                 (the bundled accessible font, all weights)
├── prefkeeper-root.css     (font-face rules + editable default colors)
└── panel.css               (PrefKeeper's own UI styling -- don't edit this one)
```

**Why a setup step, instead of everything working automatically from
`node_modules`?** Two real reasons, not just convention:

1. `node_modules` isn't guaranteed to exist wherever your site is actually
   deployed — many static hosts (Netlify, GitHub Pages, plain FTP) don't
   upload it at all. Files copied into your own project sidestep that.
2. If you use a bundler (Vite, webpack), PrefKeeper's own runtime font
   loading can't reliably guess where its files end up after your
   bundler repackages everything — this was confirmed with a real Vite
   production build, not assumed. Referencing the copied files directly
   in your own CSS avoids that guesswork entirely.

Re-running `npx prefkeeper-setup` later is safe: it never touches
`fonts/` or `prefkeeper-root.css` again once they exist (so your edits
are never lost), but it _does_ refresh `panel.css` every time, so it
never goes stale after a `npm update prefkeeper`.

## Quick start

Link all three files from your HTML — `panel.css` and
`prefkeeper-root.css` before your own site CSS, so your own rules can
still override anything PrefKeeper doesn't touch:

```html
<link rel="stylesheet" href="prefkeeper/panel.css" />
<link rel="stylesheet" href="prefkeeper/prefkeeper-root.css" />
<link rel="stylesheet" href="your-site.css" />
```

Then, anywhere in your JS:

```js
import { initPrefKeeper } from 'prefkeeper';

document.getElementById('open-preferences-btn').addEventListener('click', () => {
  initPrefKeeper();
});
```

That's it — calling `initPrefKeeper()` mounts the preference panel as a
full-screen overlay, and on your visitor's next page load, PrefKeeper
automatically re-applies whatever they last saved.

### Making your own site content respond to it

PrefKeeper works by setting CSS custom properties on
`document.documentElement`. Your own CSS just needs to reference them —
`prefkeeper-root.css` already provides sensible defaults, so your site
looks correct even before anyone has opened the panel:

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

Early (v0.8) but functional — the core preference panel, storage,
import/export, and settings are built and tested. Not yet published to
npm. A browser extension (for preferences to follow a visitor across
different sites) and a React wrapper are planned, not yet built.

## License

MIT for the code. The bundled Atkinson Hyperlegible Next font is
licensed separately under the SIL Open Font License — see
[`src/assets/fonts/OFL.txt`](./src/assets/fonts/OFL.txt).
