# AI Context — CDP-XA7ES

Read this before writing any code. It defines conventions and constraints that apply across the whole project, not just what's in the build prompt.

---

## Project

Sony CDP-XA7ES tribute music player. A browser-based front panel for a 1995 Japanese high-end CD transport, streaming public domain / CC audio from the Internet Archive. Signature element is a real segmented amber peak-level meter driven by `AnalyserNode` — not decoration, an instrument.

Two build targets from one source:
- **Artifact** — `vite-plugin-singlefile`, one portable `.html`, portfolio drop-in
- **Deployed** — Vercel, static + serverless functions, real CORS-clean audio via proxy

Deploying to **Vercel**. Server routes are SvelteKit endpoints under `src/routes/api/{resolve,stream,search}/+server.ts` — `adapter-vercel` turns each into a Vercel Function. (Earlier drafts mentioned bare `/api/*.ts` files; that was the pre-SvelteKit plan and is obsolete.)

---

## Conventions (apply everywhere, not just this file's spec)

- **Colors**: OKLCH only. Never HEX or HSL unless a spec explicitly mandates it.
- **Fonts**: `system-ui` stacks. Never `-apple-system` or `BlinkMacSystemFont`. Display/VFD mono uses `'Share Tech Mono'` (Google Fonts); shadcn's JetBrains Mono stays on the theme layer only.
- **Naming**: kebab-case for files, folders, CSS classes, Git branches. Components are kebab-case `.svelte` files (SvelteKit resolves by filename).
- **Comments**: English only, in code.
- **Copy**: any user-facing label or string is neutral Spanish, no slang, no regional accent — unless it's a technical term with no clean equivalent (keep those in English). UI labels in this project (`TRACK`, `PLAY`, `NO DISC`) are hardware silkscreen text, not prose — leave those as-is; this rule applies to anything conversational (search placeholder copy, error toasts, etc. if added).

---

## Toolchain for this build

- **Claude Code / Cursor**: primary drivers for multi-file scaffolding, the audio/CORS debugging loop, and both build targets.
- Limited hands-on Svelte/server-logic experience — explain *why* a serverless function or audio-graph pattern works, not just produce it silently.

---

## Non-negotiable technical gate

Before styling the peak meter, verify `AnalyserNode` is receiving real data:

```typescript
const data = new Uint8Array(analyser.fftSize);
analyser.getByteTimeDomainData(data);
console.log(Math.min(...data), Math.max(...data));
```

If both values are `128`, the audio graph is silent — CORS is blocking analysis, not a styling problem. Fix via `/api/stream` proxy before writing a single line of meter CSS. Do not fake this by animating from playback position in the deployed build — that fallback is reserved for the artifact target only, where a real proxy isn't available.

---

## Build order

1. Scaffold + chassis shell, empty, no logic — should already read as hardware
2. Display panel wired to fake state (cycle `empty → loading → playing → error` manually)
3. Audio engine, one hardcoded track, no Web Audio yet
4. **CORS gate** — confirm analyser data is real before proceeding
5. Peak meter — spend the most iteration time here
6. Queue, `/api/resolve` batching, search, keyboard shortcuts, title marquee
7. Both build targets verified independently

Phases 1–7 dual-build are done — see `docs/changelog.md`. Remaining: Vercel production deploy + portfolio screenshot.

---

## Related project files

- `cdp-xa7es-prompt.md` — full component/route/token spec, source of truth for implementation detail
- This file — conventions and process; read once per session, not per component
