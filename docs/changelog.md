# Changelog — CDP-XA7ES

Short entries after each build phase: what shipped, what's still open. Newest first.

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
