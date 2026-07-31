# CLAUDE.md — CDP-XA7ES

This file is read automatically at the start of every Claude Code session in this project. It's an index, not a spec — the actual content lives in the files below. Read them before writing code; don't duplicate their content here as this file drifts out of sync otherwise.

---

## Read in this order

1. **`ai-context.md`** (root) — conventions (OKLCH, kebab-case, `system-ui`, English comments), toolchain notes, the non-negotiable CORS/analyser verification gate, and build order. Read once per session.
2. **`docs/architecture.md`** — file structure, SvelteKit routing convention for the three server endpoints, dual-target build strategy, the `Track` type, and the playback state machine. Source of truth for structural questions.
3. **`cdp-xa7es-prompt.md`** (root) — design tokens, layout, component behavior (peak meter, display panel, transport controls, track list, search), keyboard shortcuts, branding, constraints. Source of truth for visual/behavioral questions.
4. **`docs/prd.md`** — why this exists, who it's for, what "done" looks like. Read when scope or priority is unclear, not for implementation detail.
5. **`docs/changelog.md`** — append a short entry after completing each build phase (what shipped, what's still open) so future sessions can pick up context without re-deriving it. Check it first at session start.
6. **`.impeccable.md`** — Design Context for Impeccable / design skills (audience, personality, aesthetic direction, principles). Canonical copy; the Design Context section below mirrors it.

---

## Fastest orientation for a new session

- **"What does X look like / how does it behave?"** → `cdp-xa7es-prompt.md`
- **"Where does X live / how is it wired?"** → `docs/architecture.md`
- **"How should I write this / what's the convention?"** → `ai-context.md`
- **"Why are we building this this way?"** → `docs/prd.md`
- **"What's already been built?"** → `docs/changelog.md`
- **"Who is this for / how should design feel?"** → `.impeccable.md`

---

## Non-negotiable, repeated here because it's the single most likely place to go wrong

Before any peak-meter styling work: verify `AnalyserNode` is receiving real audio data (see `ai-context.md` for the exact check). If it returns flat `128` values, the problem is CORS, not CSS — stop and fix the proxy route first. Full detail lives in `ai-context.md` and `docs/architecture.md`; this line exists only so the gate isn't missed on a skim.

---

## Project shape, one line

SvelteKit. Two build targets — a portable single-file HTML artifact and a Vercel-deployed version with server-side proxy routes for CORS-clean audio analysis. Everything else is in the files above.

---

## Design Context

### Users

Recruiters and portfolio reviewers evaluating Design Engineer craft — people who can tell real signal-driven UI from decoration. They encounter this as a short, intentional study, not a daily music app. The job: prove a hardware-grade faceplate can be wired to live Web Audio analysis (proxy architecture + dual build), and that the meter is an instrument, not animation.

### Brand Personality

**Refined · Precise · Timeless.** Voice is quiet and technical — silkscreen labels, VFD status, no conversational chrome. Emotional arc on first play: **ceremonial** (power-on / faceplate presence) → **comforting** (familiar ES-era controls and amber phosphor) → **immersion** (live meter tracking the music). Evoke confidence in craft and period authenticity, never playfulness or product-marketing energy.

### Aesthetic Direction

Tribute to the Sony CDP-XA7ES (1995 Japanese high-end CD transport), adapted for a browser — specs are the **baseline**, not a pixel prison. Reference 90s high-end audio gear: anodized aluminum, amber VFD cavities, segmented peak meters, rectangular transport keys, refined materials (not cheap consumer plastics or glossy modern hi-fi UI). Dark theme only.

**Anti-references:** default AI-slop interfaces; Technics/Pioneer green meters; spectrum analysers; Spotify-like players; cards, pills, soft drop shadows, glow-on-segments; light mode; rounded consumer chrome.

**Tokens & type:** OKLCH palette from the chassis/display system stays the source of truth (amber phosphor, cool-neutral aluminum). `Share Tech Mono` is a strong default for VFD/display characters — other mono faces may be tested if they read closer to real XA7ES display typography; body/silkscreen stays `system-ui` stacks. Hardware silkscreen strings (`TRACK`, `PLAY`, `NO DISC`, etc.) stay English as on the machine.

### Design Principles

1. **Meter first** — everything else stays quiet so the segmented amber peak meter carries the page; it must feel like an instrument driven by real (or honest artifact-fallback) signal.
2. **Hardware grammar, browser craft** — keep ES-era language (rectangular controls, hard segment edges, inset display cavity, amber not green) while adapting layout, hit targets, and motion for a digital interface.
3. **Refined materials** — anodized metal, warm-dark cavity, phosphor that bleeds into black; never cheap plastic, glassmorphism, or decorative gradients on the chassis.
4. **Restraint over novelty** — fewer elements, sharper hierarchy; no cards, pills, skeleton loaders, or marketing chrome. The display panel _is_ the loading/error state.
5. **Honest systems** — deployed build: real `AnalyserNode` data only; artifact build may synthesize envelope. Prefer `prefers-reduced-motion` and WCAG AA on interactive surfaces without diluting the tribute.
