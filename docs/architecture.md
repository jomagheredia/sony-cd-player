# Architecture — CDP-XA7ES

Structural spec: file layout, build strategy, server routes, and data contracts. For visual/component specs (tokens, layout, meter behavior, controls), see `cdp-xa7es-prompt.md`. For conventions and process, see `ai-context.md`.

This is a **SvelteKit** project (Svelte 5, runes mode forced project-wide — see `vite.config.ts`). Earlier drafts of this doc described a vanilla-TS/Vite structure; that was written before the SvelteKit scaffold landed and has been superseded by this version. Everything below reflects the actual repo.

---

## Build strategy

Two targets, one SvelteKit codebase, switched by **adapter**, not by framework:

| Target     | Adapter                                                                     | Purpose                                                                      |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `deployed` | `@sveltejs/adapter-auto` (resolves to `@sveltejs/adapter-vercel` on Vercel) | Real analyser data via `/api/*` server routes, batched metadata, hidden keys |
| `artifact` | `@sveltejs/adapter-static` (SPA fallback) + `vite-plugin-singlefile`        | Portable, double-click, one `.html`, portfolio drop-in                       |

This scaffold already configures the adapter inline, inside the `sveltekit()` Vite plugin call in `vite.config.ts` — there is no separate `svelte.config.js`. The artifact build follows the same pattern in a second Vite config that swaps the adapter:

```jsonc
// package.json scripts
{
	"dev": "vite dev",
	"build": "vite build", // deployed target (adapter-auto)
	"build:artifact": "vite build --config vite.config.artifact.ts",
	"preview": "vite preview"
}
```

`vite.config.artifact.ts` mirrors `vite.config.ts` but:

- passes `adapter: adapterStatic({ pages: 'build', assets: 'build', fallback: 'index.html', strict: false })` to `sveltekit()` instead of `adapter-auto`
- adds the `viteSingleFile()` plugin from `vite-plugin-singlefile`
- sets `define: { 'import.meta.env.VITE_USE_PROXY': 'false' }` (or an equivalent env var) so the client knows to call archive.org directly instead of `/api/*`

**`strict: false` on `adapter-static` matters**: the three `/api/*` routes exist in `src/routes/` but aren't prerenderable, and the artifact target never calls them (client branches on `VITE_USE_PROXY`). Without `strict: false`, `adapter-static` fails the build on those routes even though nothing in the artifact bundle references them.

**Neither `@sveltejs/adapter-static` nor `vite-plugin-singlefile` is installed yet** — both are needed only when Phase 7 (dual build target, per `ai-context.md`) starts. Flagging here so the dependency isn't missed.

**Known implementation risk, same spirit as the CORS gate below**: combining SvelteKit's client/server build pipeline with `vite-plugin-singlefile` is not an officially documented pairing (unlike CORS, which has a known, deterministic fix). It should work for this app because the player is a single route with no server-side data loading in the artifact build, but treat it as unverified until Phase 7 actually produces a working single `.html` file that opens via `file://`. If it doesn't inline cleanly, the fallback is a static multi-file `adapter-static` build (still portable, just not literally one file).

The client detects mode at runtime via `import.meta.env.VITE_USE_PROXY`. In artifact mode it calls archive.org directly and degrades gracefully (meter falls back to a simulated envelope, per the fallback spec in `cdp-xa7es-prompt.md`). In deployed mode it calls `/api/*` and gets guaranteed CORS-clean audio.

---

## File structure

```
sony-cd-player/
├── docs/
│   ├── prd.md
│   ├── ai-context.md
│   ├── architecture.md
│   ├── cdp-xa7es-prompt.md
│   └── changelog.md
├── src/
│   ├── app.html
│   ├── app.d.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte            # player shell — the whole app is one route
│   │   ├── layout.css              # Tailwind + shadcn-svelte theme layer
│   │   └── api/
│   │       ├── resolve/
│   │       │   └── +server.ts      # batch archive.org metadata → normalized tracks
│   │       ├── stream/
│   │       │   └── +server.ts      # CORS-clean audio proxy (forwards Range headers)
│   │       └── search/
│   │           └── +server.ts      # wraps archive.org advanced search
│   └── lib/
│       ├── styles/
│       │   └── tokens.css          # CDP-XA7ES OKLCH tokens (chassis/display/controls) — separate from the shadcn theme in layout.css
│       ├── components/
│       │   ├── ui/                 # shadcn-svelte primitives (existing alias, style: lyra)
│       │   ├── player-shell.svelte
│       │   ├── display-panel.svelte
│       │   ├── peak-meter.svelte   # signature element
│       │   ├── transport-controls.svelte
│       │   ├── track-list.svelte
│       │   └── search-bar.svelte
│       ├── audio/
│       │   ├── engine.ts           # <audio> element + Web Audio graph
│       │   └── metering.ts         # AnalyserNode → per-channel peak + RMS
│       ├── state/
│       │   ├── playback.svelte.ts  # typed playback state machine, runes-based
│       │   └── queue.svelte.ts     # queue/shuffle/repeat/volume, runes-based
│       ├── api/
│       │   ├── client.ts           # proxy-aware fetch layer
│       │   └── types.ts            # normalized Track type
│       ├── utils.ts                # existing shadcn cn() helper
│       └── format-time.ts
├── static/
│   └── robots.txt
├── package.json
├── vite.config.ts                  # deployed target
├── vite.config.artifact.ts         # single-file target
└── tsconfig.json
```

Naming: kebab-case for all files, CSS classes, and branches. Code comments in English only. Components are `.svelte` files (PascalCase export names are not applicable — SvelteKit resolves components by filename, which stays kebab-case per project convention).

**State**: no hand-rolled pub/sub. `playback.svelte.ts` and `queue.svelte.ts` are `.svelte.ts` modules that hold `$state` at module scope — Svelte 5's idiomatic pattern for state shared across components without a framework store library. The display panel and transport controls read/write this state directly; it's exported as plain objects/functions, not wrapped in a custom event emitter.

**Styling split**: `src/routes/layout.css` is the shadcn-svelte theme (light/dark tokens, Tailwind layers, JetBrains Mono as `--font-mono`) — leave it as shadcn manages it. `src/lib/styles/tokens.css` is the CDP-XA7ES chassis/display/control tokens from `cdp-xa7es-prompt.md` (OKLCH, amber phosphor, etc.), imported by the player shell. The player is dark-only per the PRD, so it doesn't consume shadcn's `.dark` toggle — it uses its own fixed token set regardless of that class.

**Typography note for a later pass**: `cdp-xa7es-prompt.md` specifies `'Share Tech Mono'` (Google Fonts) for display characters; the scaffold currently ships `@fontsource-variable/jetbrains-mono` as the global mono font. That's a visual-spec decision (add Share Tech Mono alongside JetBrains Mono, or reconcile the two), not a structural one — leaving it for whoever implements the display panel, flagging it here so it isn't missed.

---

## Server routes (deployed target)

Implemented as SvelteKit endpoints — a `+server.ts` file per route exporting a `GET` handler typed with `RequestHandler` from `./$types`. `adapter-vercel` turns each into a Vercel Function automatically; no hand-rolled `/api` directory or custom router.

### `GET /api/resolve?ids=a,b,c` — `src/routes/api/resolve/+server.ts`

Solves the N+1 problem. Each track otherwise needs its own `metadata/{id}` round trip before the MP3 filename is known — five default tracks means five sequential fetches before anything plays.

- Fetch all `https://archive.org/metadata/{id}` in parallel
- Pick the best audio file per item: prefer `VBR MP3`, then `128Kbps MP3`, then any `.mp3`
- Return normalized `Track[]` in one response
- `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`

### `GET /api/stream?url=<encoded>` — `src/routes/api/stream/+server.ts`

The route that makes the meter work.

- Pipe archive.org audio through with `Access-Control-Allow-Origin: *`
- **Forward `Range` request headers and `Content-Range` / `Accept-Ranges` response headers** — without this, seeking silently breaks
- Allowlist `archive.org` and `*.us.archive.org` hosts only; reject anything else
- Stream the body (`Response` with a `ReadableStream`), never buffer it

### `GET /api/search?q=<query>` — `src/routes/api/search/+server.ts`

Wraps the advanced search endpoint, keeps response shape identical to `/api/resolve`:

```
https://archive.org/advancedsearch.php
  ?q={query}+AND+format:MP3+AND+mediatype:audio
  &fl[]=identifier&fl[]=title&fl[]=creator
  &output=json&rows=15&page=1
```

---

## Data contract

Every source resolves to this shape (`src/lib/api/types.ts`), so the player never knows where a track came from:

```typescript
interface Track {
	id: string;
	title: string;
	artist: string;
	streamUrl: string;
	duration?: number; // seconds, resolved on load if absent
	source: 'archive' | 'jamendo' | 'musopen';
}
```

---

## Playback state machine

Modeled as a discriminated union — the display is a pure function of this state, not scattered conditionals. Lives in `src/lib/state/playback.svelte.ts` as module-scope `$state`, read via a getter export (Svelte 5 doesn't allow exporting a reassignable `let` bound to `$state` directly from a module, so it's wrapped in an object or accessed via functions).

```typescript
type PlaybackState =
	| { status: 'empty' }
	| { status: 'loading'; trackIndex: number }
	| { status: 'ready'; trackIndex: number }
	| { status: 'playing'; trackIndex: number }
	| { status: 'paused'; trackIndex: number }
	| { status: 'error'; trackIndex: number; reason: string };

interface QueueState {
	tracks: Track[];
	shuffle: boolean;
	repeat: 'off' | 'track' | 'all';
	volume: number;
}
```

`QueueState` lives in `src/lib/state/queue.svelte.ts`, same pattern.

---

## Default queue

Five archive.org identifiers loaded on mount so the player works on first open. Resolve via `/api/resolve` in deployed mode, direct metadata fetch in artifact mode.

```typescript
const DEFAULT_IDS = [
	'gd1977-05-08.sbd.hicks.4982.sbeok.shnf',
	'MusOpen_Beethoven_Symphony_No_5',
	'afrechot_nocturne_op9_no2',
	'cd_guitar-music-by-heitor-villa-lobos_heitor-villa-lobos',
	'PianoSonataNo14MoonlightBeethoven'
];
```

These drift. If an identifier 404s, skip it silently and continue — never let one dead item block the queue.
