# Design System — Chinook Cyber

A portable reference for the visual language used in this project, written so it can be
dropped into another codebase to reproduce the same look and feel. It documents the
*decisions* (and the reasoning behind them), not just the values — so you can apply them
consistently even in a stack that isn't React + Tailwind.

> **One-line summary:** A warm, earthy, "Pacific-Northwest-meets-Sonoran" take on a
> professional SaaS dashboard — pine green + desert tan accents on warm-sand surfaces,
> Inter for text and JetBrains Mono for data, tight headings, generous line-height,
> hairline borders, soft shadows in light mode and flat lifted slate in dark mode.

---

## 1. Design principles

These are the rules that everything else follows from. When in doubt, fall back to these.

1. **Warm, not clinical.** This is a security tool, but it deliberately rejects the
   black-background, neon-green "SOC dashboard" cliché. Surfaces are warm sand in light
   mode and lifted slate in dark mode — "PNW forest at dusk," never menacing. The goal is
   a calm, professional, readable workspace you can stare at for an hour.
2. **Semantic tokens, never raw colors.** Components reference CSS custom properties
   (`var(--bg-surface)`, `var(--text-primary)`, …), never hex literals. Theme switching is
   "free" because every color is a variable; one `data-theme` attribute flips the whole app.
3. **Data is monospaced; prose is not.** Any machine identifier (ATT&CK IDs, hashes, codes)
   renders in JetBrains Mono so it reads as *data*. Everything human-facing is Inter.
4. **Hairlines and tints over heavy chrome.** Separation comes from 1px borders and subtle
   background shifts, not drop shadows or thick rules. Light mode gets a *whisper* of
   shadow on raised cards; dark mode uses none (it relies on surface lightness instead).
5. **Tight headings, comfortable body.** Display headings get negative letter-spacing
   (`-0.02em`) to look crafted; body text gets a roomy `1.6` line-height for legibility.
6. **Restraint.** Small type (11–14px is the working range), muted secondary text, one
   accent color doing the work. Color is reserved for *meaning* (tactic phases, accents),
   not decoration.
7. **Hand-built, no component library.** Every component is bespoke so the styling stays
   coherent and there's no framework aesthetic leaking in.

---

## 2. Color

### 2.1 The accent story

| Role | Light | Dark | Meaning |
|------|-------|------|---------|
| **Primary accent** | `#58855f` (pine green) | `#6fa777` (lifted pine) | Links, active state, primary emphasis, brand "Cyber" wordmark |
| **Secondary accent** | `#e0882f` (desert tan) | `#eaa15a` (softer tan) | Secondary highlights, alternate chart series |
| **Accent glow** | `#58855f1a` | `#6fa7771f` | Faint tinted backgrounds / focus halos (accent at ~10% alpha) |

The accent shifts *lighter* in dark mode so it keeps contrast against dark surfaces — the
light-mode pine would be muddy on charcoal. Do this for any brand color you carry across
themes: don't reuse the same hex, lift it.

### 2.2 Surfaces (the warm-sand / lifted-slate ramp)

Surfaces step up in lightness as elements get "closer" to the viewer (base → surface →
raised → overlay). In dark mode the ramp inverts but the *concept* is identical: raised
things are lighter.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg-base` | `#f5efe6` | `#1d1f1d` | Page background |
| `--bg-surface` | `#fffdf9` | `#2c2e2c` | Cards, panels, top bar |
| `--bg-raised` | `#efe7da` | `#343734` | Inset wells, progress-bar tracks, hover fills |
| `--bg-overlay` | `#fffdf9` | `#3a3d39` | Popovers, dialogs, tooltips |

Note the off-white surfaces (`#fffdf9`, never pure `#ffffff`) and near-black-but-warm base
(`#1d1f1d`, never `#000`). Pure black/white is avoided everywhere — it's what makes the
palette feel warm rather than sterile.

### 2.3 Borders (three weights)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--border-subtle` | `#1d1f1d0a` (~4% ink) | `#ffffff0a` (~4% white) | Faintest dividers, row separators |
| `--border-default` | `#e4dbcd` | `#43463f` | Card outlines, the standard 1px border |
| `--border-strong` | `#d6cbb8` | `#565a51` | Emphasized edges, scrollbar thumbs |

Subtle borders are alpha-based (ink/white at 4%) so they sit naturally on any surface;
default and strong are solid.

### 2.4 Text (four weights)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--text-primary` | `#1d1f1d` | `#eef1ea` | Body copy, headings |
| `--text-secondary` | `#55605a` | `#9aa39a` | Supporting text, values |
| `--text-muted` | `#8c9088` | `#6f756c` | Labels, captions, metadata, mono IDs |
| `--text-inverse` | `#fffdf9` | `#1d1f1d` | Text on accent-filled surfaces |

A three-step prose hierarchy (primary / secondary / muted) covers almost everything; reach
for `inverse` only on colored backgrounds.

### 2.5 Shadows

```css
/* light mode only — a whisper, two stacked layers */
--shadow-card: 0 1px 2px rgba(29,31,29,0.05), 0 1px 3px rgba(29,31,29,0.08);
/* dark mode */
--shadow-card: none;
```

Shadows are tinted with the warm ink color (`29,31,29`), not neutral black, and they're
intentionally tiny. Dark mode drops them entirely and leans on surface lightness for depth.

### 2.6 Domain palettes (categorical color)

Two fixed palettes carry *meaning* and stay constant across light/dark (they're tuned to
read on both). If you reuse them, keep the order — the order is the identity.

**Tactic / kill-chain phases** (offensive, follows attack order):
```
recon/resource #94a3b8 · initial-access #f97316 · execution #ef4444 ·
persistence #a855f7 · priv-esc #ec4899 · stealth #14b8a6 · defense-impair #fb7185 ·
credential #f59e0b · discovery #eab308 · lateral #3b82f6 · collection #6366f1 ·
c2 #06b6d4 · exfil #84cc16 · impact #ff4444
```

**D3FEND defensive tactics** (defensive, cooler/calmer):
```
model #64748b · harden #14b8a6 · detect #4f8ef7 · isolate #8b5cf6 ·
deceive #f59e0b · evict #f43f5e · restore #22c55e
```

**General-purpose categorical ramp** (for charts, leaderboards — earthy, reads on both themes):
```js
const CATEGORICAL = [
  "#e0882f", "#58855f", "#4f8ef7", "#a855f7", "#ec4899", "#14b8a6", "#f59e0b",
  "#ef4444", "#6366f1", "#84cc16", "#06b6d4", "#8b5cf6", "#eab308", "#f97316",
];
```
Note it *leads* with the brand tan and pine so the first two series are always on-brand.

---

## 3. Typography

| Aspect | Decision |
|--------|----------|
| **Text typeface** | `Inter`, falling back to `system-ui, sans-serif` |
| **Mono typeface** | `JetBrains Mono`, falling back to `ui-monospace, SFMono-Regular, monospace` |
| **Loaded weights** | Inter 400/500/600/700; JetBrains Mono 400/500 (only what's used) |
| **Base size** | `14px` on `body` |
| **Base line-height** | `1.6` (roomy, for sustained reading) |
| **Heading tracking** | `letter-spacing: -0.02em` on `h1/h2/h3`; `margin: 0` (spacing is owned by layout) |
| **Smoothing** | `-webkit-font-smoothing: antialiased` + `-moz-osx-font-smoothing: grayscale` |
| **Inter features** | `font-feature-settings: "cv02","cv03","cv04","cv11"` (single-story a, etc. — a more geometric Inter) |
| **Mono tweak** | `.mono` disables ligatures (`font-variant-ligatures: none`) so IDs read literally |

### Type scale in practice

The working range is small and dense — this is a data tool. Observed sizes, by frequency:

- **11px** — labels, captions, metadata, subtitles (the most common size after 12/13)
- **12px** — mono IDs, secondary values, dense table text
- **13px** — primary list/row text
- **14px** — panel titles, body default
- **15–17px** — section/page headings
- **18–28px** — hero numbers and the largest display headings only

### The `.data-label` convention

A single reusable utility for every "field label" / eyebrow in the UI:
```css
.data-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}
```
Uppercase + wide tracking (`0.08em`) + muted color = the signature "label" texture. Note
the *positive* tracking here vs. *negative* on headings — labels spread out, headings tighten.

### Numbers

Numeric values use `tabular-nums` (and `mono` where appropriate) so columns of figures
align and don't jitter as they update.

---

## 4. Spacing, radius & layout

**Spacing** follows a 4px grid (Tailwind's default scale). The most-used steps in practice:
`gap-2` (8px) and `gap-3` (12px) for flex layouts; `px-3`/`px-4` (12/16px) for component
padding; `px-8` (32px) for page gutters; `py-6`/`py-7` (24/28px) for vertical page rhythm.
Card internal padding is `p-4` (16px). Keep gaps small and consistent — density is a feature.

**Border radius** — small and uniform. The vocabulary:

| Radius | Value | Use |
|--------|-------|-----|
| `rounded` / `rounded-sm` | 2–4px | Icon buttons, color dots (dots use a literal `borderRadius: 2`) |
| `rounded-md` | 6px | Inputs |
| `rounded-lg` | 8px | **Cards / panels — the default container radius** |
| `rounded-full` | pill | Progress bars, badges, avatars |

Nothing is heavily rounded — `8px` cards are as soft as it gets. The look is crisp, not bubbly.

**Layout shell** — a classic app frame:
- Persistent left **sidebar** at `240px` (`md` and up), fixed width, `shrink-0`.
- On mobile (below `md`) the sidebar collapses into an off-canvas **drawer** (`280px`, capped
  at `85vw`) behind a `rgba(0,0,0,0.45)` scrim, with a slim top bar hosting a hamburger + wordmark.
- Main content area scrolls independently (`overflow-y-auto`, `min-h-0 min-w-0 flex-1`).
- The whole thing is `flex h-full flex-col md:flex-row`.

---

## 5. Theming mechanics

Light is the **default** (`:root`); dark is opt-in via `:root[data-theme="dark"]`.

1. **Tokens live in CSS variables** under `:root` and `:root[data-theme="dark"]`. Domain
   palettes that don't change live in a shared `:root` block.
2. **A flash-free inline script** in `<head>` reads the persisted choice from
   `localStorage` and sets `data-theme` *before first paint*:
   ```html
   <script>
     try {
       if (localStorage.getItem("chinook-theme") === "dark")
         document.documentElement.setAttribute("data-theme", "dark");
     } catch (e) {}
   </script>
   ```
3. **A small hook owns toggling thereafter** — sets state, mirrors it to `data-theme`
   (removing the attribute for light, since light is the `:root` default), and persists it.
4. **Smooth transition** — `body` transitions `background-color` and `color` over `0.2s ease`
   so theme switches don't hard-cut.

To port: copy the two `:root` blocks, the inline script, and the toggle hook. Everything
else inherits automatically because components only ever reference variables.

---

## 6. Component patterns

These are the recurring recipes. Even outside React, the *structure* transfers.

### Card / Panel
The canonical container: `rounded-lg p-4`, `1px solid var(--border-default)`,
`background var(--bg-surface)`, `box-shadow var(--shadow-card)`. Header is a baseline-aligned
flex row: a `14px` semibold title (+ optional `11px` muted subtitle) on the left, an optional
action slot on the right, `mb-3` below.

### Badges & IDs
- **Machine IDs** (`AttackIdBadge`): always `.mono`, `12px`, muted by default with a `primary`
  tone variant; when linked, they're `target="_blank" rel="noreferrer"` and hover to
  `--text-primary`. Rule: *IDs are never plain text.*
- **Category badge** (`TacticBadge`): a `2px`-rounded color dot (`8×8px`) + a `.data-label`
  name + an optional muted `tabular-nums` count. The dot color comes from the domain palette.

### Ranked bars / leaderboards
Each row: label (`13px` medium) + optional mono sub-label + right-aligned `tabular-nums`
value, with a `1.5px`-tall `rounded-full` track (`--bg-raised`) and an accent-filled fill
bar underneath. Clickable rows are a `group` button whose label shifts to `--accent-primary`
on `group-hover`. Bar fill color is passed in as a `var(--…)` expression, so the same
component serves multiple palettes.

### Interaction & motion
- **Hover** is understated: a color shift to the accent or primary text, or a `--bg-raised`
  fill on icon buttons — via `transition-colors`. No scaling, no big movement.
- **Focus** is a single hairline: `outline: 1px solid var(--accent-primary); outline-offset: 1px`
  on `:focus-visible` (keyboard only).
- **Reduced motion** is honored globally — `@media (prefers-reduced-motion: reduce)` clamps
  all animation/transition durations to `0.01ms`.

### Scrollbars
Custom, slim (`10px`), transparent track, thumb in `--border-strong` with a `3px` border in
`--bg-base` (so the thumb looks inset) and an `8px` radius. Subtle, never attention-grabbing.

---

## 7. Drop-in starter

Minimal files to reproduce the look in a fresh Tailwind + Vite project.

**`tailwind.config.js`** — register the font families:
```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
```

**`index.html` `<head>`** — fonts + flash-free theme:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<script>
  try {
    if (localStorage.getItem("app-theme") === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
  } catch (e) {}
</script>
```

**`index.css`** — copy the full token blocks from §2 plus this base layer:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* :root { …light tokens… }  :root[data-theme="dark"] { …dark tokens… }  (see §2) */

@layer base {
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: "Inter", system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  h1, h2, h3 { margin: 0; letter-spacing: -0.02em; }
  a { color: inherit; text-decoration: none; }
  :focus-visible { outline: 1px solid var(--accent-primary); outline-offset: 1px; }
}

@layer utilities {
  .data-label {
    font-size: 11px; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-muted);
  }
  .mono { font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-ligatures: none; }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
}
```

Two small color helpers worth bringing along:
```js
/** Resolve a CSS custom property to a concrete color (for canvas/chart libs). */
export function cssVar(expr) {
  const name = expr.replace("var(", "").replace(")", "").trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#8a8f86";
}
/** "#rrggbb" → "rgba(r,g,b,a)". */
export function withAlpha(color, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
```

---

## 8. Quick checklist for a cohesive port

- [ ] Use the CSS variables — never hardcode a hex in a component.
- [ ] Off-white/warm-black surfaces, never `#fff` / `#000`.
- [ ] Inter for prose, JetBrains Mono for every machine identifier.
- [ ] `14px / 1.6` body; tight (`-0.02em`) headings; uppercase `.data-label` eyebrows.
- [ ] `rounded-lg` (8px) cards, 1px `--border-default`, whisper shadow in light / none in dark.
- [ ] Pine-green primary accent (lift it for dark), tan secondary; color only where it means something.
- [ ] Hairline `:focus-visible` outline; understated `transition-colors` hovers; honor reduced-motion.
- [ ] Flash-free theme script in `<head>`; light is the default, dark is `data-theme="dark"`.
