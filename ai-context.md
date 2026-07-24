# AI Context — CDP-XA7ES

Read this before writing any code. It defines conventions and constraints that apply across the whole project, not just what's in the build prompt.

---

## Project

Sony CDP-XA7ES tribute music player. A browser-based front panel for a 1995 Japanese high-end CD transport, streaming public domain / CC audio from the Internet Archive. Signature element is a real segmented amber peak-level meter driven by `AnalyserNode` — not decoration, an instrument.

Two build targets from one source:
- **Artifact** — `vite-plugin-singlefile`, one portable `.html`, portfolio drop-in
- **Deployed** — Vercel, static + serverless functions, real CORS-clean audio via proxy

Deploying to **Vercel**. Serverless functions live in `/api` using Vercel's file-based convention (`api/resolve.ts`, `api/stream.ts`, `api/search.ts`), not a custom router.

---

## Conventions (apply everywhere, not just this file's spec)

- **Colors**: OKLCH only. Never HEX or HSL unless a spec explicitly mandates it.
- **Fonts**: `system-ui` stacks. Never `-apple-system` or `BlinkMacSystemFont`.
- **Naming**: kebab-case for files, folders, CSS classes, Git branches. PascalCase reserved for exported framework components only (not applicable here — this project is vanilla TS, no framework).
- **Comments**: English only, in code.
- **Copy**: any user-facing label or string is neutral Spanish, no slang, no regional accent — unless it's a technical term with no clean equivalent (keep those in English). UI labels in this project (`TRACK`, `PLAY`, `NO DISC`) are hardware silkscreen text, not prose — leave those as-is; this rule applies to anything conversational (search placeholder copy, error toasts, etc. if added).

---

## Toolchain for this build

- **Claude Code**: primary driver for this project — multi-file scaffolding, the audio/CORS debugging loop, both build targets.
- **Cursor**: inline edits only, once the shell exists (tuning meter decay timing, small CSS pass).
- Limited hands-on Svelte/server-logic experience — lean on Claude Code to explain *why* a serverless function or audio-graph pattern works, not just produce it silently.

---

## Non-negotiable technical gate

Before styling the peak meter, verify `AnalyserNode` is receiving real data:

```typescript
const data = new Uint8Array(analyser.frequencyBinCount);
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
6. Queue, `/api/resolve` batching, search
7. Both build targets verified independently

---

## Related project files

- `cdp-xa7es-prompt.md` — full component/route/token spec, source of truth for implementation detail
- This file — conventions and process; read once per session, not per component
