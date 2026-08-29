# Sony CDP-XA7ES — Component & Visual Spec

Design and behavior spec for the player's UI. For file structure, build targets, server routes, and data contracts, see `architecture.md`. For conventions and process, see `ai-context.md`.

---

## What it is

A tribute to the Sony CDP-XA7ES, a 1995 Japanese high-end CD transport. The browser becomes the front panel of the machine. It streams public domain and Creative Commons audio from the Internet Archive.

The signature element is a **segmented amber peak-level meter** driven by real audio data — not a decoration, an instrument. Everything else in the interface stays quiet so the meter carries the page.

---

## Design tokens — OKLCH only, no HEX

The live token set is `src/lib/styles/tokens.css` — read that file, not this block, when you need an exact
value. The shape of the system:

- **Chassis** (`--chassis-void`, `-bg`, `-panel`, `-panel-hi`, `-edge`, `-groove`) — cool-neutral anodized
  aluminum at hue 260. `--chassis-void` is the room behind the machine; `--chassis-panel-hi` is the top bevel
  catching light.
- **Gold** (`--gold`, `--gold-dim`) — the accent block beside POWER and ES-era badging. The only warm thing on
  the chassis.
- **Cavity** (`--display-bg`, `--display-bg-deep`, `--segment-off`) — near-black at hue ~58. `--segment-off` is
  deliberately dark: an unlit VFD segment is _structure, not light_. If a silent meter looks lit, this value is
  wrong.
- **Phosphor** (`--phosphor-bright`, `--phosphor`, `--phosphor-mid`, `--phosphor-low`, `--phosphor-peak`) — the
  amber emission ramp, plus red-orange for over-level segments.
- **Silkscreen** (`--text-label`, `--text-secondary`) — printed on metal, never glowing. `--text-label` sits at
  62% lightness because that is the floor that clears WCAG AA for 10px labels on the faceplate.

Every color in every component derives from these. No raw values in component files.

Two deliberate hue families, as on the machine: the chassis is cool-neutral, the cavity is warm amber. Nothing
in the cavity is neutral; nothing on the chassis is warm except the gold.

### Typography

Three families, each with a job:

- `'DSEG7 Classic'` (`@fontsource/dseg7-classic`, self-hosted so it inlines into the artifact build) — true
  seven-segment numerals for the **large** readouts only: elapsed time and track number. It is not legible
  below ~20px, so nothing small uses it.
- `'Share Tech Mono'` (Google Fonts) — everything else inside the cavity: title, status badge,
  indicator strip, dB scale, total time.
- `system-ui, sans-serif` — chassis silkscreen and track list. Never `-apple-system` or `BlinkMacSystemFont`.

Scale is five fixed steps at roughly a 1.3 ratio (`--type-silk` 10px → `--type-sm` 13 → `--type-md` 17 →
`--type-lg` 22), plus one fluid step for the hero time readout (`--type-hero`, `clamp(2rem, 4.2vw, 3rem)`). The
cavity is a hero object rather than a text column, which is why that one step is fluid.

---

## Layout

The machine is a viewport-filling instrument: `.stage` centers it in a darker surround (`--chassis-void`) so the
faceplate sits _in_ the page rather than on it. The chassis has a max width of 1100px and follows the real
430 × 125 mm enclosure with `aspect-ratio: 430 / 125`.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SONY                   XA7ES                                  DIGITAL OUT  │
│              CURRENT PULSE D/A CONVERT SYSTEM                       •     │
├──────────────────────┬─────────────────────────────┬───────────────────────┤
│ [POWER] ▪            │ ┌─────────────────────────┐ │ 1  2  3  4  5  D.OUT │
│ ⌐ON  ⌐OFF            │ │ SHUFFLE REPEAT     PLAY│ │ •  •  •  •  •    •   │
│ ○ PHONES   LINE OUT  │ │ TRACK 01               │ │ 6  7  8  9 10        │
│             ◯ LEVEL  │ │ dB  L ▮▮▮▮▮▯▯ R ▮▮▮▯ │ │ •  •  •  •  •        │
│ [◄◄] [►►]            │ │ 02:47 ───────── 05:12  │ │ [△ OPEN/CLOSE] [►][❙❙][■] │
│    AMS                │ └─────────────────────────┘ │                       │
│ [|◄◄] [►►|]          │ COMPACT DISC DIGITAL AUDIO │                       │
├──────────────────────┴─────────────────────────────┴───────────────────────┤
│                                              COMPACT DISC PLAYER CDP-XA7ES │
└────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────┐
│ TRACK LIST + SEARCH — temporary external panel                            │
└────────────────────────────────────────────────────────────────────────────┘
```

The faceplate body is a three-column grid using `minmax(0, 3fr) minmax(0, 4fr) minmax(0, 3fr)`: power, phones,
level and AMS at left; the display inside the tray bezel at center; program and transport controls at right.
The header follows the same tracks. `minmax(0, …)` remains load-bearing because archive.org titles can run past
100 characters. Below 900px the aspect ratio is released and the zones stack; the compact header treatment
continues below 720px and the chassis is edge-to-edge below 420px.

The track list remains fully functional but sits in a temporary full-width panel below the chassis. Phase E
replaces it with the tray loading surface.

---

## Power-on ceremony

The faceplate starts in standby: chassis present and legible, cavity fully black, every control except POWER
genuinely `disabled`. Pressing POWER runs the warm-up. State lives in `src/lib/state/power.svelte.ts`.

| Phase       | Window    | What happens                                                                                                             |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `standby`   | —         | Cavity black, `--segment-off-live: transparent` so unlit segments vanish, faceplate zones at 50% opacity except POWER.   |
| `energize`  | 0–180ms   | Filament bloom overshoots and settles; no glyphs yet.                                                                    |
| `self-test` | 180–880ms | Every segment strikes L→R, 22ms apart, R offset 70ms. Glyphs read `TRACK 88`, `88:88`, all indicators lit, badge `TEST`. |
| `on`        | 880ms+    | Real values. Controls become live.                                                                                       |

Then the TOC-read beat: the display holds `LOAD ···` while the queue resolve is actually in flight, and the track
list shows `READING TOC`. That beat reflects a real fetch — it is not a timed fake, and it must not become one.

Two constraints that are easy to break:

- **POWER is the audio unlock.** Browsers only honour `AudioContext.resume()` inside a user gesture, so
  `engine.unlock()` is called from the POWER handler. This is why the first play is instant. Do not move it.
- **The bloom settles low** (opacity 0.18). It overshoots to 0.9 on the strike, but if it rests high the cavity
  stops reading as black and the phosphor stops reading as the only light in it.

Replay is once per session, tracked in `sessionStorage` under `xa7es-power`. Powering the unit off and on again
arms the full ceremony. `prefers-reduced-motion` collapses the whole thing to a 200ms fade with no sweep and no
flicker.

---

## Signature element: the peak-level meter

Period-correct choice. Sony ES gear used segmented peak meters, not spectrum analysers — this is the detail that reads as authentic to anyone who knows the hardware.

**Spec:**

- Two horizontal rows, L and R, 14 segments each, laid out on a 14-column grid so the dB scale above can align
  to exact segment boundaries
- Unlit segment: `--segment-off`. Lit intensity **ascends** with level — `--phosphor` (1–9) →
  `--phosphor-bright` (10–11) → `--phosphor-peak` (12–14). Heat rising toward the top is what makes it read as
  an instrument; an earlier draft dipped to a _darker_ amber at 11–12, which read as a dead spot.
- A dB scale sits above the rows, marked at the segment each threshold actually maps to given the −48…−3 dB
  window in `metering.ts` (−40 at 3, −30 at 6, −20 at 9, −10 at 12, −3 at 14). If that window changes, these
  marks move. A scale that lies is worse than no scale.
- Segments are hard-edged rectangles, 3px gap, no rounding, no glow on individual segments
- **Peak-hold**: highest segment reached stays lit for 1200ms, then decays one segment per 80ms
- Driven by `AnalyserNode.getByteTimeDomainData()` → per-channel RMS and instantaneous peak, at 60fps via `requestAnimationFrame`
- Use a `ChannelSplitterNode` to get true L/R separation, not a mono average

**Fallback (artifact mode, when CORS blocks analysis):** synthesize a plausible envelope from playback position
with light randomness. Never show a dead meter — a dead meter reads as broken, not as honest. But a meter that
merely _moves_ is not enough either: a bar parked at 10–12 of 14 with 2 segments of jitter still reads as
decoration. **Shape the envelope in the segment domain, not in amplitude.** The −48…−3 dB window spans 14
segments, so each segment is ~3.2 dB and an amplitude curve has to swing ~20× to walk the scale; shaping
amplitude by eye reliably produces a parked bar. `simulateEnvelope` layers phrase (slow swell), bar, transient,
flutter and noise, and returns segments directly.

Calibrate against the **displayed** value, not the raw one — peak-hold lifts the visible floor toward the recent
maximum, so raw range always overstates what a viewer sees. Target: full 5–14 travel, mass at 10–12, top segment
lit no more than ~2% of the time so clip still means something. Verify by sampling the built artifact in a
browser, not just by reading the function.

**Verification gate:** before styling the meter, `console.log` the analyser output. If every value is exactly 128, the audio graph is silent and you are debugging CORS, not CSS. Fix that first — see `architecture.md` for the `/api/stream` proxy that solves this.

---

## Display panel

Simulated VFD cavity: `box-shadow: inset 0 0 24px oklch(0% 0 0 / 0.85), 0 0 10px oklch(82% 0.16 72 / 0.06)`

Rows:

1. Indicator strip: `SHUFFLE` / `REPEAT` / `REPEAT 1` left, status badge right. The indicators are lit/unlit
   silkscreen driven by queue state — the period-correct place for mode state. They are `aria-hidden`; keyboard
   shortcuts still toggle shuffle/repeat even though those keys are no longer on the faceplate.
2. `TRACK` silkscreen label + track number in `'DSEG7 Classic'`
3. Track title, `'Share Tech Mono'` — scrolls only when it overruns the cavity, and only by the measured
   overflow: dwell, walk to the end at ~38 px/s, dwell, snap back. One string on screen at all times; never a
   two-copy seamless loop, which reads as garbled text rather than a title. Clipped, not ellipsized — a hard
   edge at the cavity boundary is the hardware behavior.
4. dB scale, then peak meter L over R
5. Elapsed time as the hero readout (`--type-hero`, DSEG7) — seek bar (2px, clickable) with the total stacked
   beneath it, right-aligned

The elapsed digits are large but sit at `--phosphor-mid`, one step below the lit segments. Size draws the eye,
but the meter keeps it because the meter is brighter and it is the only thing moving. Do not brighten the digits
to match the segments.

Add a scanline overlay across the whole cavity: `repeating-linear-gradient` at 3px intervals, `oklch(0% 0 0 / 0.18)`, `pointer-events: none`.

Status badge states — display is a pure function of power + the playback state machine (see `architecture.md`):

| State     | Badge      | Behavior                   |
| --------- | ---------- | -------------------------- |
| `empty`   | `NO DISC`  | Blinks at 1Hz              |
| `loading` | `LOAD ···` | Dots animate               |
| `ready`   | `STOP`     | Meter at zero              |
| `playing` | `PLAY`     | Meter live                 |
| `paused`  | `PAUSE`    | Meter frozen at last value |
| `error`   | `DISC ERR` | Blinks 3×, auto-advances   |

---

## Controls

Rectangular, `border-radius: var(--radius)`, flat surface, 1px border. `transform: scale(0.96)` on `:active` with 80ms spring-back. Toggled state uses `--btn-active` for text and border.

Every control except POWER is genuinely `disabled` until `power.ready` — dimmed _and_ inert, so keyboard and
assistive tech agree with what the eye sees. The global keydown handler returns early for the same reason.

Hierarchy: POWER has the lightest face on the faceplate (in standby it is the only live control). Play is wider
than its neighbours with brighter text. Mode keys are the smallest. Not every key is primary.

| Control        | Glyph           | Behavior                                                                               |
| -------------- | --------------- | -------------------------------------------------------------------------------------- |
| Power          | `POWER`         | Toggle standby ⇄ on. Runs the ceremony, unlocks audio, stops playback on off.          |
| Line out level | rotary          | Static Phase A control whose pointer mirrors the current volume and `↑`/`↓` shortcuts. |
| Scan           | `◄◄` / `►►`     | Seek backward/forward 5 seconds through the existing seek handler.                     |
| Previous/next  | `\|◄◄` / `►►\|` | Preserve the existing previous/next behavior.                                          |
| Play           | `►`             | Calls the existing play/pause toggle until Phase D splits the handlers.                |
| Pause          | `❙❙`            | Calls the existing play/pause toggle until Phase D splits the handlers.                |
| Stop           | `■`             | Stop and reset position.                                                               |
| Open/close     | `△`             | Inert placeholder until tray behavior lands.                                           |
| Program pad    | round keys      | Inert, focusable placeholders for numeric/program functions.                           |

Geometric Unicode only. No emoji.

---

## Track list

A recessed well in a temporary full-width panel below the chassis (`--chassis-groove` with an inset shadow), not
a card. Header carries the panel label and a track count (`05 TR`). Max-height 232px, min-height 168px so the panel
does not collapse when empty, 2px gold scrollbar.

Each row:

```
▸  [nn]  Title   Artist                          [mm:ss]
```

- Active track: `▸` caret in the index column plus brightened text and a warm background tint. **Not** a left
  accent bar — a coloured `border-left` wider than 1px is the single most overused "design touch" in dashboard
  UI and it never reads as intentional. The caret is also what the layout sketch always showed.
- Title and artist are separate spans that can _both_ shrink and ellipsize. Real archive.org rows run past 100
  characters in the title alone, with an equally long artist string after it.
- Odd rows carry a faint background so long lists stay scannable
- Hover: subtle bg lift. Click: load + play immediately
- Empty: `NO DISC` + `Search the archive below to load tracks.` While the initial resolve is in flight:
  `READING TOC` + what it is doing. The panel teaches the interface rather than sitting blank.

---

## Search

Input plus a `SEARCH` key at the bottom of the track list panel.

- Placeholder: `SEARCH ARCHIVE.ORG`
- Font: `'Share Tech Mono'`, amber text, recessed dark field, neutral border that warms on focus (an always-on
  amber border made the field compete with the cavity)
- The key is disabled until there is a query, and reads `BUSY` during a fetch
- On Enter (or the search key): calls `/api/search` (see `architecture.md`)
- Append results to track list (don't replace existing queue)
- Show `SEARCHING ···` in display during fetch
- On empty results: show `NO RESULTS` in display for 2s, then restore current state

---

## Keyboard

| Key   | Action          |
| ----- | --------------- |
| Space | Play / pause    |
| ← / → | Seek ∓5s        |
| N / P | Next / previous |
| S     | Shuffle         |
| R     | Repeat cycle    |
| ↑ / ↓ | Volume ±5%      |

---

## Branding

- Header left: `SONY`, `--text-label`, raised-lettering treatment
- Header center: `XA7ES` in gold with `CURRENT PULSE D/A CONVERT SYSTEM` beneath
- Header right: `DIGITAL OUT` with its LED dot
- Tray bezel: centered `COMPACT DISC DIGITAL AUDIO`
- Right zone: program pad and split transport (play / pause / stop / open-close)
- Bottom rail: `COMPACT DISC PLAYER CDP-XA7ES` only, with `XA7` larger than its surrounding text — no spec string

---

## Constraints

- No `<form>` elements — button handlers and `keydown` only
- No `alert()` / `confirm()` / `prompt()`
- OKLCH only, no HEX or HSL in any component
- `system-ui` stacks, never `-apple-system`
- kebab-case throughout; English code comments
- `prefers-reduced-motion`: skip the self-test and collapse warm-up to a fade, freeze the title scroll, disable
  transitions, hold meter at RMS instead of animating peaks
- WCAG AA contrast on all interactive elements; visible keyboard focus
- Responsive to 360px — aspect ratio released below 900px (zones stack); compact header below 720px; chassis edge-to-edge below 420px
- Dark only

### Anti-patterns

- No rounded or pill buttons
- No card-style track rows, padding above 8px
- No skeleton loaders — the display panel _is_ the loading state
- No drop shadows on buttons; inset only. (The machine itself casts one soft shadow onto the surround — that
  grounds the unit in the room and is not the same thing as shadowed chrome.)
- No decorative gradient backgrounds on the chassis. The 1px anodized grain overlay at 1.2% alpha is a
  _material_, not a wash; if it ever becomes visible as a gradient, it has gone too far.
- No coloured `border-left`/`border-right` accent stripes wider than 1px on rows, panels, or callouts
- No glow on individual meter segments. The cavity-wide filament bloom is the only emission effect.
- No spectrum analyser in place of the peak meter — wrong era

---

## Delivery

Build in this order: tokens and shell → display panel → state machine (see `architecture.md`) → audio engine → **verify analyser returns non-zero data** → peak meter → track list → search → second build target. Full phase breakdown lives in `ai-context.md`.
