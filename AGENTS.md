# AGENTS.md

Project-specific guidance for agents working in this repo. For architecture, conventions, and design specs, start with `CLAUDE.md` (session index) and the docs it points to (`ai-context.md`, `docs/architecture.md`, `cdp-xa7es-prompt.md`).

## Cursor Cloud specific instructions

This is a single SvelteKit (Svelte 5, runes) app — the browser front panel for the "Sony CDP-XA7ES" tribute music player. There is no separate backend or database; the only server-side code is three SvelteKit endpoints under `src/routes/api/{resolve,search,stream}/+server.ts`, which proxy the public Internet Archive (`archive.org`). On Vercel these become serverless functions; in local `vite dev` they run inside the dev server.

### Running / building / checking

Standard scripts live in `package.json` — use them directly:

- `npm run dev` — dev server on `http://localhost:5173` (single service; nothing else needs to run).
- `npm run build` — deployed/Vercel target (`adapter-vercel`, real analyser via `/api/*`).
- `npm run build:artifact` — single-file portfolio build to `build-artifact/index.html` (`adapter-static`, calls archive.org directly with `VITE_USE_PROXY=false`).
- `npm run check` — `svelte-check` type/diagnostics (currently clean: 0/0).
- `npm run lint` — `prettier --check` + `eslint`. See caveat below.

### Non-obvious caveats

- **`npm run lint` reports 2 pre-existing eslint errors** in `src/lib/components/display-panel.svelte` (`@typescript-eslint/no-unused-expressions` on the bare `titleText;` / `titleBoxWidth;` lines used to register `$effect` dependencies). These are in committed app code, not a setup artifact — do not "fix" them as part of environment work. `prettier --check` passes and `npm run check` is clean.
- **Audio requires POWER first.** Nothing plays until you click the on-screen `POWER` key. Its power-on ceremony calls `engine.unlock()` to open the `AudioContext` from a user gesture, so the first play doesn't fight the browser autoplay policy. Clicking a track before powering on does nothing.
- **The live peak meter is driven by a real `AnalyserNode`.** The project's own success signal is the console log `[CDP-XA7ES CORS gate] <min> <max> PASS` — if `<min> <max>` are real values (not `128 128`), the analyser is receiving decoded audio and the amber meter is signal-driven. This is the canonical "it works" check (see `ai-context.md`).
- **archive.org is an external, sometimes-flaky dependency.** The `/api/stream`, `/api/resolve`, and `/api/search` routes fetch `archive.org`, which frequently returns `302` CDN redirects (the proxy follows them) and, from datacenter IPs, **intermittent upstream `nginx` `500`s** for the same request (e.g. an open-ended `Range: bytes=0-` may alternate `206`/`500` on retries). Those 500s are archive.org's response passed through faithfully by the proxy — not a local bug. Symptoms: choppy playback, `500` entries on `/api/stream?url=…` in the console/network tab, or a meter that stalls after buffering. Prefer bounded-range checks and retries when validating the proxy, and treat occasional stream 500s as external rather than a regression. Default track IDs also drift and 404 over time (handled by skipping them).
