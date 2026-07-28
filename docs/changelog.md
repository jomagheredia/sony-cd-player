# Changelog — CDP-XA7ES

Short entries after each build phase: what shipped, what's still open. Newest first.

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
