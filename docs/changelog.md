# Changelog — CDP-XA7ES

Short entries after each build phase: what shipped, what's still open. Newest first.

---

## 2026-08-29 — Phase A: faceplate proportion and zoning

**What shipped:**

- Chassis now follows the real 430 × 125 mm enclosure (`aspect-ratio: 430 / 125`, `max-width: 1100px`) with a
  30/40/30 three-zone faceplate: power/phones/level/AMS at left, tray bezel + display at center, program pad and
  split transport at right.
- Header band spans the same tracks (`SONY` / `XA7ES` / `DIGITAL OUT` LED). Bottom rail carries the unit spec
  string. The display panel sits unchanged inside a static tray bezel with chrome-like inner edge, screw details,
  and the Compact Disc mark.
- Track list + search moved out of the faceplate into a temporary full-width panel below the chassis
  (`TODO(phase-E)`). Zones stack and the aspect ratio is released below 900px.
- Transport is now three keys: play and pause both call the existing toggle (`TODO(phase-D)`); stop is unchanged;
  open/close and the numeric pad are inert, focusable placeholders. Level is a static rotary whose pointer
  mirrors `queue.volume`. Keyboard shortcuts are unchanged.

**What's still open:**

- Phase B materials/finish, Phase D distinct play/pause handlers and rotary drag, Phase E tray loading surface.
- Shuffle/repeat remain keyboard-only until a later control pass; their VFD indicators still light from queue
  state.

---

## 2026-07-31 — Production deploy live

**Production URL:** [https://sony-cd-player.vercel.app/](https://sony-cd-player.vercel.app/)

**Verified on production:**

- Homepage 200, TTFB under 1s
- `/api/resolve` — returns track metadata for default queue IDs
- `/api/search` — returns archive.org hits
- `/api/stream` — 200 with `access-control-allow-origin: *` (CORS gate path clear for live meter)
- All three serverless routes responding on Vercel

**Still open:**

- Portfolio screenshot (meter lit during playback) — capture manually in browser while a track plays

**Artifact (separate from Vercel):** `npm run build:artifact` → `build-artifact/index.html` for portfolio drop-in.

---

## 2026-07-31 — Production deploy prep

**What shipped:**

- Merged phases 6–7 into `main`: resolve/search APIs, keyboard shortcuts, title marquee, dual build (`npm run build:artifact`).
- Pinned `@sveltejs/adapter-vercel` in [`vite.config.ts`](../vite.config.ts) for reliable Vercel builds.
- Pre-deploy verification passed locally: `check`, `lint`, `build`, `build:artifact`; preview smoke test confirmed `/api/resolve`, `/api/search`, and `/api/stream` (CORS `*` headers).
- Pushed to [github.com/jomagheredia/sony-cd-player](https://github.com/jomagheredia/sony-cd-player) on `main`.
- Updated [`README.md`](../README.md) with Vercel import steps.

**Production URL:** [https://sony-cd-player.vercel.app/](https://sony-cd-player.vercel.app/) — _Pending at time of prep; see entry above._

**Post-deploy checklist (run on live URL once deployed):**

- CORS gate console log shows `PASS`; meter animates during playback
- Play / pause / seek / prev / next work
- Search returns tracks progressively
- Capture portfolio screenshot (meter lit during playback)

**Artifact (separate from Vercel):** `npm run build:artifact` → `build-artifact/index.html` for portfolio drop-in.

---

## 2026-07-30 — Craft pass: power-on ceremony + faceplate polish

**What shipped:**

- `src/lib/state/power.svelte.ts` — power state machine (`standby → energize → self-test → on`, 180ms/700ms),
  session-scoped replay via `sessionStorage['xa7es-power']`, reduced-motion path collapsing to a 200ms fade.
  Powering off stops playback and resets the meter.
- `power-key.svelte` (POWER key + gold accent block, amber pilot) and `level-control.svelte` (LINE OUT LEVEL
  fader — volume already had `↑`/`↓` shortcuts but no visible state). `engine.unlock()` opens the AudioContext
  from the POWER gesture, so the first play never fights autoplay policy.
- Ceremony: cavity filament bloom that overshoots then settles at 0.18, full segment self-test striking L→R
  22ms apart with the right channel offset 70ms, `TRACK 88` / `88:88` / all indicators lit / badge `TEST`, then
  a TOC-read beat driven by the _real_ queue resolve.
- **Fixed a layout bug found with real data:** the two deck columns had no `min-width: 0`, so a 100-character
  archive.org title stole width from the display cavity and crushed it to a sliver, mangling the transport row.
  Deck is now a `minmax(0, 1.35fr) minmax(0, 1fr)` grid.
- **Fixed a dead artifact meter, twice.** First pass: `simulateEnvelope` returned amplitudes of 0.29–0.94, which
  through the −48…−3 dB window pinned all 14 segments on permanently. Reshaping the amplitude fixed the peg but
  sampling the built artifact showed it only travelling 10–12 of 14 over a full 14s cycle — still a parked bar,
  just parked lower. The window spans 14 segments across 45 dB, so ~3.2 dB per segment: any amplitude curve wide
  enough to walk the scale has to swing ~20×. Now shaped directly in the segment domain from four layers
  (phrase / bar / transient / flutter + noise). Modelled the distribution through the actual peak-hold path
  before shipping: travels 5–14, mass at 10–12, top segment lit 2.3% of the time so clip stays meaningful.
  Live artifact sampling confirms 8–13 across a phrase with an audible-looking dynamic drop.
- **Rewrote the title scroll.** The two-copy seamless loop showed the tail of one string and the head of the next
  simultaneously, which read as garbled text rather than one title. Replaced with a measured single-pass scroll:
  `scrollWidth` vs container width gives the exact overflow, the element scrolls by that amount and no more, at a
  constant 38 px/s with a 3.2s dwell at each end and a snap back. Only engages when the title actually overruns
  the cavity — at full width nothing scrolls at all.
- Retuned the whole token set: near-black cavity with `--segment-off` dark enough that a silent meter reads as
  silent (was bright enough to look fully lit), ascending amber→red segment heat (the old 11–12 band dipped
  _darker_), 5-step type scale at ~1.3 ratio plus a fluid hero step, `--text-label` raised to 62% lightness for
  WCAG AA on 10px silkscreen, gold accent, semantic space scale, easing tokens.
- `@fontsource/dseg7-classic` for the large digits and track number — true seven-segment numerals, self-hosted
  so they inline as a data URL and render offline in the artifact. Share Tech Mono keeps everything smaller,
  where DSEG7 stops being legible.
- Chassis is now a viewport-filling instrument: centered in a darker surround, anodized grain overlay, top
  bevel, one soft shadow grounding it. Top rail carries `XA7ES` + `CURRENT PULSE D/A CONVERT SYSTEM`; POWER far
  left and transport right, as on the faceplate.
- Track list: replaced the 2px left accent bar (a hard anti-pattern) with a `▸` caret in the index column plus
  a warm row tint; title and artist both shrink and ellipsize; recessed well instead of a card; `NO DISC` /
  `READING TOC` empty states that say what to do.
- Every control except POWER is genuinely `disabled` until warm-up completes, and the global keydown handler
  returns early — inert to eye, keyboard, and assistive tech alike. The level fader's fill dims in standby too;
  left bright it was the most eye-catching thing on a sleeping faceplate.
- `--phosphor-peak` moved from hue 36 to 44 — the clip segments were reading pink against amber instead of
  running hot within the same phosphor family.
- Renamed a local `const state` in `display-panel.svelte` to `playbackState`: it shadowed the `$state` rune, so
  Svelte parsed `$state(0)` as store auto-subscription and `svelte-check` threw four errors.
- Verified: ceremony phase timings traced in-browser, reduced-motion confirmed collapsing standby → energize →
  on inside 260ms with the self-test skipped, CORS gate still PASS with live stereo asymmetry (12L/11R), empty
  state forced by blocking `/api/resolve`, title scroll measured at 390px (188px overflow, 11.35s cycle, one
  string on screen) with no horizontal overflow, meter travel sampled in the built artifact, both build targets,
  `svelte-check` 0/0.

**What's still open:**

- Portfolio screenshot (meter lit during playback) — production is live at
  [https://sony-cd-player.vercel.app/](https://sony-cd-player.vercel.app/).
- Under `prefers-reduced-motion`, an over-long title stops scrolling and is hard-clipped at the cavity edge, so
  its tail is unreachable there. The full string is in the track list row, so nothing is lost outright — but a
  non-animated affordance (tap-to-reveal, or wrapping to a second cavity line) would close it properly.
- `npm run lint` fails on `prettier --check` for seven markdown/config files and one pre-existing eslint error
  in `src/app.d.ts` (`ImportMetaEnv` unused). All predate this pass; left alone to keep the diff focused.

---

## 2026-07-28 — Phase 7: dual build target

**What shipped:**

- `vite.config.artifact.ts` — `@sveltejs/adapter-static` (`strict: false`, SPA `fallback`, out dir `build-artifact`) + `kit.output.bundleStrategy: 'inline'` + `VITE_USE_PROXY=false`. Skipped `vite-plugin-singlefile` (Kit-native inline is reliable here).
- `src/routes/+layout.ts` — `ssr = false` for the SPA shell.
- `npm run build:artifact` (+ `scripts/prune-artifact.mjs`) → single `build-artifact/index.html` (~252KB). Verified: chassis loads, default queue resolves 5 tracks via direct IA metadata, proxy path stays off (`useProxy` → `false`).
- `npm run build` (adapter-auto) still compiles `/api/{stream,resolve,search}` with proxy on for Vercel.

**What's still open:**

- Vercel production deploy + portfolio screenshot of the live URL.
- Opening the artifact via `file://` works for the HTML itself; Share Tech Mono still needs network (Google Fonts). Meter uses the simulated envelope when CORS blocks analysis (expected).

---

## 2026-07-28 — Search feels faster (progressive resolve)

**What shipped:**

- `/api/search` returns advancedsearch hits only (no N metadata waits). Client resolves stream URLs in batches of 3 via `/api/resolve` and appends as each batch lands — `SEARCHING` clears on the first batch.
- Metadata fetches use a 3.5s timeout and concurrency 4 so one slow archive.org item can't stall the whole search.

**What's still open:**

- Phase 7: dual build + Vercel deploy.

---

## 2026-07-28 — Docs synced to phases 1–6

**What shipped:**

- Updated `CLAUDE.md`, `ai-context.md`, and `docs/architecture.md` so session orientation matches the repo: SvelteKit routes (not bare `/api/*.ts`), file tree includes `archive.ts` / `meter.svelte.ts` / `ui.svelte.ts`, Share Tech Mono marked resolved, build order notes phases 1–6 done / phase 7 next.

**What's still open:**

- Phase 7: dual build + Vercel deploy (unchanged).

---

## 2026-07-28 — Phase 6: resolve, search, keyboard, marquee

**What shipped:**

- `GET /api/resolve` + `GET /api/search` — batch metadata / advanced search → normalized `Track[]` (shared helpers in `src/lib/api/archive.ts`). Dead ids skipped silently.
- Client `resolveTracks` / `searchTracks` (proxy or direct for artifact). Player shell loads `DEFAULT_IDS` on mount; search appends unique hits. Display flashes `SEARCHING ···` / `NO RESULTS` (2s).
- Keyboard shortcuts on the chassis (Space, ←/→, N/P, S/R, ↑/↓); ignored while typing in the search field. Shuffle randomizes next/prev when enabled.
- Title marquee for titles over 28 characters; frozen under `prefers-reduced-motion`.
- Verified: default queue resolves to 5 tracks, play works, Space pauses, search appends (5 → 20 for “erik satie gymnopedie”).

**What's still open:**

- Phase 7 next: dual build (`adapter-static` + `vite-plugin-singlefile`), Vercel deploy, portfolio screenshot.

---

## 2026-07-27 — Phase 5: live peak meter

**What shipped:**

- Web Audio graph is now `MediaElementSource → destination` plus `ChannelSplitter → analyserL / analyserR` for true stereo metering.
- `src/lib/audio/metering.ts` — time-domain peak + RMS → 14-segment dB mapping, peak-hold (1200ms then −1 segment / 80ms), artifact-mode simulated envelope, `prefers-reduced-motion` holds at RMS (no peak chase).
- `src/lib/audio/meter.svelte.ts` — rAF loop exposing reactive L/R display levels; start on play, freeze on pause, reset on stop/load/error.
- Display panel drives `<PeakMeter>` from live levels. Verified: Beethoven 5 hit ~11–12 lit segments while playing; pause froze non-zero; stop returned to 0. CORS gate still PASS.

**What's still open:**

- Phase 6 next: `/api/resolve` batching, `/api/search`, replace hardcoded queue URLs, keyboard shortcuts, title marquee.
- Phase 7: dual build target (`adapter-static` + single-file artifact) and Vercel deploy.

---

## 2026-07-27 — Phase 4: CORS gate cleared

**What shipped:**

- `src/routes/api/stream/+server.ts` — archive.org audio proxy with `Access-Control-Allow-Origin: *`, Range / Content-Range forwarding, and host allowlist (`archive.org` + `*.archive.org` for regional CDN edges like `*.ca.archive.org`). Rejects non-IA hosts.
- `src/lib/api/client.ts` — `toStreamUrl()` routes media through `/api/stream` unless `VITE_USE_PROXY=false` (artifact build).
- Engine now sets `crossOrigin="anonymous"`, builds a one-shot Web Audio graph (`MediaElementSource → AnalyserNode → destination`), and logs the ai-context CORS gate sample on play (`[CDP-XA7ES CORS gate] min max PASS|FAIL`). `src/lib/audio/metering.ts` holds `sampleTimeDomain()`.
- Verified: proxy returns 200 / 206 with CORS headers; seek still works through the proxy; analyser time-domain min/max are not stuck at `128` while playing.

**What's still open:**

- Phase 5 next: peak meter driven by real analyser data (ChannelSplitter L/R, peak-hold, segment mapping). Do not fake the meter.
- `/api/resolve`, `/api/search`, keyboard shortcuts, marquee, dual build target — later phases.

---

## 2026-07-27 — Phase 3: audio engine, one hardcoded track

**What shipped:**

- `src/lib/audio/engine.ts` — HTMLAudioElement wrapper (load / play / pause / stop / seek / volume). No Web Audio graph and no `crossOrigin` yet — those wait for the CORS proxy in phase 4.
- Playback state machine now drives real audio: `loading` → `canplay` → `playing`/`ready`, with pause/stop/ended/error wired from element events. Fake load timers and the status-badge `devCycle` affordance are gone.
- Five hardcoded archive.org streams in the queue (nocturne, So What cover, Blue Rondo guitar arr., Beethoven 5 / Moonlight) so every track-list row plays before `/api/resolve` lands in phase 6.
- Display elapsed time + seek bar track engine position; seek is clickable (and ←/→ when focused). Previous restarts the current track when past 3s.
- Repeat modes honored on `ended` (`track` loops, `all`/`off` advance or stop). Verified in a real browser: play → pause → prev-to-0 → cross-track load → stop.

**What's still open:**

- Meter still dead (level 0) — intentional until the CORS gate clears.
- Phase 4 next: `/api/stream` proxy + confirm `AnalyserNode` returns non-flat data before any meter styling.
- Keyboard shortcuts (global), title marquee, `/api/resolve` batching, search, dual build target — later phases.

---

## 2026-07-24 — Phase 2: display panel wired to the playback state machine

**What shipped:**

- `src/lib/state/playback.svelte.ts` — the typed discriminated-union state machine from `architecture.md` (`empty | loading | ready | playing | paused | error`), held as module-scope `$state` behind a getter. Transitions (`load`, `toggle`, `stop`, `next`, `previous`, `fail`) run against fake timers (600ms load latency, 1600ms error auto-advance) — the audio engine replaces the timers as the transition source in phase 3.
- `src/lib/state/queue.svelte.ts` — queue/shuffle/repeat/volume state, seeded with five placeholder tracks (real `/api/resolve` data arrives in phase 6). `src/lib/api/types.ts` (`Track`) and `src/lib/format-time.ts` created per the architecture layout.
- Display panel is now a pure function of the state machine: badge per state (`NO DISC` blinking 1Hz / `LOAD ···` animated dots / `STOP` / `PLAY` / `PAUSE` / `DISC ERR` blinking 3× at 500ms then auto-advancing past the bad track), track number/title/duration from queue state, `TRACK --` + `--:--` when empty. `prefers-reduced-motion` disables all blink/dot animations.
- Transport controls wired: play/pause toggles (glyph swaps `►`/`❙❙`), stop → ready, next/prev preserve play-vs-stopped intent, shuffle/repeat toggle with amber active styling (repeat shows `↺¹` in track mode). Track-list rows are now buttons — click loads + plays that track.
- **Dev-only affordance, remove in phase 3:** clicking the status badge steps the display through all six states in order, satisfying the phase-2 "cycle manually" requirement without extra UI.
- Verified in a real browser: every state rendered and read back from the live DOM (including the `DISC ERR` 0.5s×3 blink animation and its auto-advance to the next track), transport buttons and track clicks exercised by real clicks. `npm run check`, eslint, prettier all clean.

**What's still open:**

- Meter is intentionally dead in all states (level 0) — it stays that way until the CORS gate clears in phase 4 and real `AnalyserNode` data drives it in phase 5. Elapsed time is pinned at `00:00` and the seek bar at 0% until the engine provides position (phase 3).
- Marquee for titles over 28 chars not yet implemented (no placeholder title exceeds it); keyboard shortcuts not yet implemented — both slot naturally into later phases.
- Phase 3 is next: audio engine (`src/lib/audio/engine.ts`), one hardcoded track, no Web Audio graph yet.

---

## 2026-07-24 — Phase 1: chassis shell + tokens

**What shipped:**

- `src/lib/styles/tokens.css` — the full OKLCH token set from `cdp-xa7es-prompt.md` (chassis, display, controls, silkscreen), imported by the player shell.
- Static, unwired chassis: `player-shell.svelte` (branding, two-column/responsive frame), `display-panel.svelte` (VFD cavity with inset shadow + scanline overlay, static example content), `peak-meter.svelte` (14-segment L/R meter, presentational — takes a `level` prop, no `AnalyserNode` yet), `transport-controls.svelte`, `track-list.svelte`, `search-bar.svelte`. All content is hardcoded placeholder data; no click handlers, no state, no animation — per the build order, phase 1 is structure only.
- `src/routes/+page.svelte` now renders the player shell instead of the SvelteKit welcome boilerplate.
- Verified in a real browser at desktop width and (via a temporary CSS override, since the browser tool couldn't drive the real viewport below ~606px) at a simulated sub-600px width — single-column stacking works, no overflow, track titles truncate correctly. `npm run check` and lint are clean.

**What's still open:**

- Two flagged-not-fixed items from the previous entry remain open: the Share Tech Mono vs. JetBrains Mono font decision (resolved pragmatically for now — Share Tech Mono loads via Google Fonts and is used for all display/mono text in the new components; JetBrains Mono still governs shadcn UI elsewhere), and no `@sveltejs/adapter-static` / `vite-plugin-singlefile` install yet (still a Phase 7 concern).
- Phase 2 is next: wire the display panel to a real (fake-cycled) playback state machine — `empty → loading → playing → error` — instead of the static example content shipped here.
- No audio, no real track data, no Vercel deployment yet.

---

## 2026-07-24 — Docs reconciled to SvelteKit; no feature phases started yet

**What shipped:**

- Rewrote `docs/architecture.md`, which still described the pre-SvelteKit vanilla-TS/Vite plan (`src/main.ts`, bare `api/*.ts` Vercel functions, hand-rolled pub/sub state). It now reflects the actual scaffold: SvelteKit + Svelte 5 runes (forced on in `vite.config.ts`), server routes as `src/routes/api/{resolve,stream,search}/+server.ts`, state as `.svelte.ts` runes modules under `src/lib/state/`, components as `.svelte` files under `src/lib/components/`.
- Documented the dual-build adapter strategy for real: `adapter-auto` (→ `adapter-vercel`) for the deployed target, `adapter-static` (SPA fallback, `strict: false`) + `vite-plugin-singlefile` for the artifact target. Flagged that neither `@sveltejs/adapter-static` nor `vite-plugin-singlefile` is installed yet, and that pairing SvelteKit's build pipeline with `vite-plugin-singlefile` is unverified — treat it as a real risk to validate in Phase 7, not a solved recipe.
- Noted the styling split: shadcn-svelte's theme stays in `src/routes/layout.css` untouched; the CDP-XA7ES chassis/display tokens from `cdp-xa7es-prompt.md` will live in a separate `src/lib/styles/tokens.css`, since the player is dark-only and doesn't use shadcn's light/dark toggle.
- Flagged (not fixed — visual-spec call, not structural) that `cdp-xa7es-prompt.md` specifies `'Share Tech Mono'` for the display, while the scaffold currently ships `@fontsource-variable/jetbrains-mono` as the global mono font. Needs a decision when the display panel is built.

**What's still open:**

- Zero player implementation exists. `src/routes/+page.svelte` is still the default SvelteKit welcome page. None of the six build phases in `ai-context.md` (chassis shell → display panel → audio engine → CORS gate → peak meter → queue/search/dual build) have started.
- No Vercel deployment has happened. A real Vercel session is available in this environment via the Vercel plugin (team: `jos-projects-c17fa8c6`), so deployment is mechanically possible once there's something worth deploying — deploying the untouched scaffold now would just ship the SvelteKit welcome page.
- Next session should start at Phase 1 (chassis shell + tokens, no logic) per the build order in `ai-context.md`.
