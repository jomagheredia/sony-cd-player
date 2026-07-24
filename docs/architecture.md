# Architecture — CDP-XA7ES

Structural spec: file layout, build strategy, server routes, and data contracts. For visual/component specs (tokens, layout, meter behavior, controls), see `cdp-xa7es-prompt.md`. For conventions and process, see `ai-context.md`.

---

## Build strategy

Two targets, one codebase:

| Target | Build | Purpose |
|---|---|---|
| `artifact` | `vite-plugin-singlefile` → one `.html` | Portable, double-click, portfolio drop-in |
| `deployed` | Vercel static + serverless functions | Real analyser data, batched metadata, hidden keys |

The client detects mode at runtime via `import.meta.env.VITE_USE_PROXY`. In artifact mode it calls archive.org directly and degrades gracefully (meter falls back to a simulated envelope). In deployed mode it calls `/api/*` and gets guaranteed CORS-clean audio.

```jsonc
// package.json scripts
{
  "dev":            "vite",
  "build":          "vite build",
  "build:artifact": "vite build --config vite.config.artifact.ts",
  "preview":        "vite preview"
}
```

`vite.config.artifact.ts` adds `vite-plugin-singlefile` and sets `VITE_USE_PROXY=false`. Output: one `.html` with everything inlined except the Google Fonts link.

Deploying to **Vercel**. Serverless functions use Vercel's file-based convention under `/api` — not a custom router.

---

## File structure

```
cdp-xa7es/
├── docs/
│   ├── prd.md
│   ├── ai-context.md
│   ├── architecture.md
│   ├── cdp-xa7es-prompt.md
│   └── changelog.md
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts              # deployed target
├── vite.config.artifact.ts     # single-file target
├── api/
│   ├── resolve.ts              # batch archive.org metadata → normalized tracks
│   ├── stream.ts                # CORS-clean audio proxy (forwards Range headers)
│   └── search.ts                 # wraps archive.org advanced search
└── src/
    ├── main.ts
    ├── styles/
    │   ├── tokens.css          # OKLCH custom properties
    │   └── app.css
    ├── components/
    │   ├── player-shell.ts
    │   ├── display-panel.ts
    │   ├── peak-meter.ts       # signature element
    │   ├── transport-controls.ts
    │   ├── track-list.ts
    │   └── search-bar.ts
    ├── audio/
    │   ├── engine.ts           # <audio> element + Web Audio graph
    │   └── metering.ts         # AnalyserNode → per-channel peak + RMS
    ├── state/
    │   ├── machine.ts          # typed playback state machine
    │   └── store.ts            # minimal pub/sub, no framework
    ├── api/
    │   ├── client.ts           # proxy-aware fetch layer
    │   └── types.ts            # normalized Track type
    └── utils/
        └── format-time.ts
```

Naming: kebab-case for all files, CSS classes, and branches. Code comments in English only.

---

## Server routes (deployed target)

### `GET /api/resolve?ids=a,b,c`

Solves the N+1 problem. Each track otherwise needs its own `metadata/{id}` round trip before the MP3 filename is known — five default tracks means five sequential fetches before anything plays.

- Fetch all `https://archive.org/metadata/{id}` in parallel
- Pick the best audio file per item: prefer `VBR MP3`, then `128Kbps MP3`, then any `.mp3`
- Return normalized `Track[]` in one response
- `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`

### `GET /api/stream?url=<encoded>`

The route that makes the meter work.

- Pipe archive.org audio through with `Access-Control-Allow-Origin: *`
- **Forward `Range` request headers and `Content-Range` / `Accept-Ranges` response headers** — without this, seeking silently breaks
- Allowlist `archive.org` and `*.us.archive.org` hosts only; reject anything else
- Stream the body, never buffer it

### `GET /api/search?q=<query>`

Wraps the advanced search endpoint, keeps response shape identical to `/api/resolve`:

```
https://archive.org/advancedsearch.php
  ?q={query}+AND+format:MP3+AND+mediatype:audio
  &fl[]=identifier&fl[]=title&fl[]=creator
  &output=json&rows=15&page=1
```

---

## Data contract

Every source resolves to this shape, so the player never knows where a track came from:

```typescript
interface Track {
  id:        string;
  title:     string;
  artist:    string;
  streamUrl: string;
  duration?: number;   // seconds, resolved on load if absent
  source:    'archive' | 'jamendo' | 'musopen';
}
```

---

## Playback state machine

Modeled as a discriminated union — the display is a pure function of this state, not scattered conditionals.

```typescript
type PlaybackState =
  | { status: 'empty' }
  | { status: 'loading';  trackIndex: number }
  | { status: 'ready';    trackIndex: number }
  | { status: 'playing';  trackIndex: number }
  | { status: 'paused';   trackIndex: number }
  | { status: 'error';    trackIndex: number; reason: string };

interface QueueState {
  tracks:  Track[];
  shuffle: boolean;
  repeat:  'off' | 'track' | 'all';
  volume:  number;
}
```

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
