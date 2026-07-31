# CDP-XA7ES — Sony CD Player Tribute

Browser-based tribute to the Sony CDP-XA7ES (1995), streaming public-domain audio from the Internet Archive with a live Web Audio peak meter.

## Develop

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```sh
npm run build           # Vercel / deployed target (real analyser via /api/*)
npm run build:artifact  # single-file portfolio HTML → build-artifact/index.html
```

## Deploy to Vercel

Live at **[https://sony-cd-player.vercel.app/](https://sony-cd-player.vercel.app/)**

To redeploy: push to `main` on [github.com/jomagheredia/sony-cd-player](https://github.com/jomagheredia/sony-cd-player). No environment variables required.

- `/api/stream` — CORS-clean audio proxy (required for the live meter)
- `/api/resolve` — batch archive.org metadata
- `/api/search` — archive.org search

## Post-deploy verification

On the live URL, confirm:

- Console shows `[CDP-XA7ES CORS gate] … PASS` while playing
- Peak meter segments respond to audio
- Search returns tracks progressively
- Network tab shows `/api/stream?url=…` (not direct archive.org)

## Docs

- [`cdp-xa7es-prompt.md`](cdp-xa7es-prompt.md) — design spec
- [`docs/architecture.md`](docs/architecture.md) — structure and build strategy
- [`docs/changelog.md`](docs/changelog.md) — build phases
