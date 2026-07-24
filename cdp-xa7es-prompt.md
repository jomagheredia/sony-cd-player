# Sony CDP-XA7ES — Component & Visual Spec

Design and behavior spec for the player's UI. For file structure, build targets, server routes, and data contracts, see `architecture.md`. For conventions and process, see `ai-context.md`.

---

## What it is

A tribute to the Sony CDP-XA7ES, a 1995 Japanese high-end CD transport. The browser becomes the front panel of the machine. It streams public domain and Creative Commons audio from the Internet Archive.

The signature element is a **segmented amber peak-level meter** driven by real audio data — not a decoration, an instrument. Everything else in the interface stays quiet so the meter carries the page.

---

## Design tokens — OKLCH only, no HEX

```css
:root {
  /* Chassis — anodized aluminum, neutral-cool */
  --chassis-bg:        oklch(15% 0.005 260);
  --chassis-panel:     oklch(19% 0.006 260);
  --chassis-edge:      oklch(28% 0.008 260);

  /* Display cavity — warm-dark, amber bleeds into the black */
  --display-bg:        oklch(11% 0.015 60);
  --display-amber:     oklch(82% 0.16 72);   /* Active phosphor */
  --display-amber-mid: oklch(62% 0.13 70);   /* Meter mid-range */
  --display-dim:       oklch(45% 0.09 68);   /* Inactive segment */
  --display-peak:      oklch(70% 0.20 32);   /* Peak-hold / clip */

  /* Controls */
  --btn-surface:       oklch(23% 0.006 260);
  --btn-border:        oklch(32% 0.008 260);
  --btn-text:          oklch(65% 0.012 260);
  --btn-active:        oklch(82% 0.16 72);

  /* Silkscreen */
  --text-label:        oklch(48% 0.01 260);
  --text-secondary:    oklch(60% 0.012 260);

  --radius:            2px;
  --space:             4px;
}
```

Every color in every component derives from these. No raw values in component files.

### Typography

- `'Share Tech Mono'` (Google Fonts) — display characters only: track number, time, title marquee
- `system-ui, sans-serif` — everything else. Never `-apple-system` or `BlinkMacSystemFont`.

---

## Layout

Desktop two-column, mobile stacked:

```
┌──────────────────────────────────────────────────────────┐
│  SONY                                     CDP-XA7ES      │
│ ┌───────────────────────────┐  ┌──────────────────────┐  │
│ │ TRACK 01           PLAY   │  │ TRACK LIST           │  │
│ │ Blue Rondo à la Turk      │  │ ▸ 01  Blue Rondo...  │  │
│ │ ▁▂▃▅▆▇█▇▆▅▃▂▁ L          │  │   02  So What        │  │
│ │ ▁▂▃▄▅▆▇▆▅▄▃▂▁ R          │  │   03  Nocturne       │  │
│ │ 02:47 ────────●──── 05:12 │  │ ──────────────────── │  │
│ └───────────────────────────┘  │ [ SEARCH ARCHIVE   ] │  │
│ ┌───────────────────────────┐  └──────────────────────┘  │
│ │  |◄◄   ►   ■   ►►|   ⇌ ↺  │                            │
│ └───────────────────────────┘                            │
│              COMPACT DISC DIGITAL AUDIO                  │
└──────────────────────────────────────────────────────────┘
```

---

## Signature element: the peak-level meter

Period-correct choice. Sony ES gear used segmented peak meters, not spectrum analysers — this is the detail that reads as authentic to anyone who knows the hardware.

**Spec:**
- Two horizontal rows, L and R, 14 segments each
- Segment gradient by position: `--display-dim` (off) → `--display-amber` (1–10) → `--display-amber-mid` (11–12) → `--display-peak` (13–14)
- Segments are hard-edged rectangles, 3px gap, no rounding, no glow on individual segments
- **Peak-hold**: highest segment reached stays lit for 1200ms, then decays one segment per 80ms
- Driven by `AnalyserNode.getByteTimeDomainData()` → per-channel RMS and instantaneous peak, at 60fps via `requestAnimationFrame`
- Use a `ChannelSplitterNode` to get true L/R separation, not a mono average

**Fallback (artifact mode, when CORS blocks analysis):** synthesize a plausible envelope from playback position with light randomness. Never show a dead meter — a dead meter reads as broken, not as honest.

**Verification gate:** before styling the meter, `console.log` the analyser output. If every value is exactly 128, the audio graph is silent and you are debugging CORS, not CSS. Fix that first — see `architecture.md` for the `/api/stream` proxy that solves this.

---

## Display panel

Simulated VFD cavity: `box-shadow: inset 0 0 24px oklch(0% 0 0 / 0.85), 0 0 10px oklch(82% 0.16 72 / 0.06)`

Rows:
1. `TRACK [nn]` large left — status badge right
2. Track title, `'Share Tech Mono'` — marquee scroll if over 28 characters
3. Peak meter, L over R
4. Elapsed left — seek bar center (2px, clickable) — total right

Add a scanline overlay across the whole cavity: `repeating-linear-gradient` at 3px intervals, `oklch(0% 0 0 / 0.18)`, `pointer-events: none`.

Status badge states — display is a pure function of the playback state machine (see `architecture.md`):

| State | Badge | Behavior |
|---|---|---|
| `empty` | `NO DISC` | Blinks at 1Hz |
| `loading` | `LOAD ···` | Dots animate |
| `ready` | `STOP` | Meter at zero |
| `playing` | `PLAY` | Meter live |
| `paused` | `PAUSE` | Meter frozen at last value |
| `error` | `DISC ERR` | Blinks 3×, auto-advances |

---

## Transport controls

Rectangular, `border-radius: var(--radius)`, flat surface, 1px border. `transform: scale(0.96)` on `:active` with 80ms spring-back. Toggled state uses `--btn-active` for text and border.

| Control | Glyph | Behavior |
|---|---|---|
| Previous | `|◄◄` | Previous track, or seek to 0 if past 3s |
| Play/Pause | `►` / `❙❙` | Toggle |
| Stop | `■` | Stop and reset position |
| Next | `►►|` | Advance queue |
| Shuffle | `⇌` | Toggle |
| Repeat | `↺` | Cycle off → track → all |

Geometric Unicode only. No emoji.

---

## Track list

Scrollable panel, max-height 280px, custom scrollbar (2px, amber).

Each row:
```
[nn]  Title — Artist                           [mm:ss]
```

- Active track: left accent bar in `--display-amber`, text brightens
- Hover: subtle bg lift
- Click: load + play immediately

---

## Search

Single input at the bottom of the track list panel.
- Placeholder: `SEARCH ARCHIVE.ORG`
- Font: `'Share Tech Mono'`, amber text, dark bg, 1px amber border
- On Enter (or search button): calls `/api/search` (see `architecture.md`)
- Append results to track list (don't replace existing queue)
- Show `SEARCHING ···` in display during fetch
- On empty results: show `NO RESULTS` in display for 2s, then restore current state

---

## Keyboard

| Key | Action |
|---|---|
| Space | Play / pause |
| ← / → | Seek ∓5s |
| N / P | Next / previous |
| S | Shuffle |
| R | Repeat cycle |
| ↑ / ↓ | Volume ±5% |

---

## Branding

- Top-left `SONY`, `--text-label`, `letter-spacing: 0.3em`, small caps
- Top-right `CDP-XA7ES`, `'Share Tech Mono'`, same color, smaller
- Bottom edge, centered, 8px: `COMPACT DISC DIGITAL AUDIO`

Nothing else.

---

## Constraints

- No `<form>` elements — button handlers and `keydown` only
- No `alert()` / `confirm()` / `prompt()`
- OKLCH only, no HEX or HSL in any component
- `system-ui` stacks, never `-apple-system`
- kebab-case throughout; English code comments
- `prefers-reduced-motion`: freeze marquee, disable transitions, hold meter at RMS instead of animating peaks
- WCAG AA contrast on all interactive elements; visible keyboard focus
- Responsive to 360px — single column below 600px
- Dark only

### Anti-patterns

- No rounded or pill buttons
- No card-style track rows, padding above 8px
- No skeleton loaders — the display panel *is* the loading state
- No drop shadows on buttons; inset only
- No gradient backgrounds on the chassis
- No spectrum analyser in place of the peak meter — wrong era

---

## Delivery

Build in this order: tokens and shell → display panel → state machine (see `architecture.md`) → audio engine → **verify analyser returns non-zero data** → peak meter → track list → search → second build target. Full phase breakdown lives in `ai-context.md`.
