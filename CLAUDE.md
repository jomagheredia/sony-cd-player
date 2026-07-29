# CLAUDE.md — CDP-XA7ES

This file is read automatically at the start of every Claude Code session in this project. It's an index, not a spec — the actual content lives in the files below. Read them before writing code; don't duplicate their content here as this file drifts out of sync otherwise.

---

## Read in this order

1. **`ai-context.md`** (root) — conventions (OKLCH, kebab-case, `system-ui`, English comments), toolchain notes, the non-negotiable CORS/analyser verification gate, and build order. Read once per session.
2. **`docs/architecture.md`** — file structure, SvelteKit routing convention for the three server endpoints, dual-target build strategy, the `Track` type, and the playback state machine. Source of truth for structural questions.
3. **`cdp-xa7es-prompt.md`** (root) — design tokens, layout, component behavior (peak meter, display panel, transport controls, track list, search), keyboard shortcuts, branding, constraints. Source of truth for visual/behavioral questions.
4. **`docs/prd.md`** — why this exists, who it's for, what "done" looks like. Read when scope or priority is unclear, not for implementation detail.
5. **`docs/changelog.md`** — append a short entry after completing each build phase (what shipped, what's still open) so future sessions can pick up context without re-deriving it. Check it first at session start.

---

## Fastest orientation for a new session

- **"What does X look like / how does it behave?"** → `cdp-xa7es-prompt.md`
- **"Where does X live / how is it wired?"** → `docs/architecture.md`
- **"How should I write this / what's the convention?"** → `ai-context.md`
- **"Why are we building this this way?"** → `docs/prd.md`
- **"What's already been built?"** → `docs/changelog.md`

---

## Non-negotiable, repeated here because it's the single most likely place to go wrong

Before any peak-meter styling work: verify `AnalyserNode` is receiving real audio data (see `ai-context.md` for the exact check). If it returns flat `128` values, the problem is CORS, not CSS — stop and fix the proxy route first. Full detail lives in `ai-context.md` and `docs/architecture.md`; this line exists only so the gate isn't missed on a skim.

---

## Project shape, one line

SvelteKit. Two build targets — a portable single-file HTML artifact and a Vercel-deployed version with server-side proxy routes for CORS-clean audio analysis. Everything else is in the four files above.
