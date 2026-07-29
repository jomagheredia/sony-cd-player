# PRD — Sony CDP-XA7ES Tribute Player

---

## Problem

Design Engineers at high-end product companies (Sony, Technics, Denon) bridge visual design and backend systems to ship hardware-grade interfaces. This project demonstrates that bridge: taking period-authentic UI design (the XA7ES faceplate) and wiring it to real signal processing (a Web Audio meter) via a proxy layer that makes remote streams analysis-safe.

Portfolio context: most Design Engineer artifacts stop at UI + a REST API. This one proves the architectural thinking — knowing when a single file is enough, when a proxy buys real capability, and how to ship both.

---

## What we're building

A Sony CDP-XA7ES tribute player — a browser-based front panel for a 1995 Japanese high-end CD transport, streaming public domain audio from the Internet Archive. The signature element is a segmented amber peak-level meter driven by live Web Audio analysis, not animation — a period-correct design choice that grounds the interface in real signal flow.

Two build outputs from one codebase:
- **Single-file artifact** (`adapter-static` + `bundleStrategy: 'inline'` → `.html`) — portfolio drop-in, works offline-ish, falls back to synthesized meter
- **Deployed app** (Vercel → static + serverless) — real audio analysis, batched metadata, CORS-clean streaming

---

## For whom

- **Recruiter / portfolio reviewer** scrolling design system work, looking for someone who understands both the craft (faceplate typography, peak-meter segment gradients) and the systems (why you need a proxy, what `Range` headers do)
- **Not** a general-purpose music player for end users — this is a narrow, intentional design study

---

## Success criteria

The project is done when:

1. **Both builds work** — artifact runs standalone in a browser (`file://` or served), deployed version runs on Vercel without CORS fallback
2. **Meter is real** — `AnalyserNode` drives the meter; console verification passes (min/max not stuck at 128)
3. **Loads fast** — cold artifact load under 200ms, deployed version cold start under 1s, hot start under 100ms
4. **Faceplate reads as hardware** — anyone who knows Sony ES gear recognizes the design language (amber not green, segmented not spectrum, rectangular buttons, monospace VFD)
5. **Audio streams** — five default archive.org tracks load, play, seek works, error states visible
6. **One portfolio screenshot** — clean shot of the meter animating against track playback; this is the one image that proves the concept

---

## Non-goals

- General-purpose music streaming app — this is a tribute, not a Spotify competitor
- Mobile-native app — web-only by design
- Exhaustive archive.org API coverage — just enough to make the queue real
- Light mode — dark only
- Accessibility beyond WCAG AA — important but not a primary narrative for this artifact
- Handling every edge case (404s in archive.org, truncated MP3s, etc.) — graceful fallback is enough

---

## Scope boundary

This is a **six-week artifact** at sustainable pace (≈10 hrs/week, Vercel free tier, no paid infrastructure).

- Phases 1–4 (scaffold, shell, audio engine, CORS gate): 1–1.5 weeks
- Phase 5 (meter tuning): 2–3 weeks — this is where the signature lives, worth the time
- Phase 6 (queue/search/dual build): 1–1.5 weeks
- Testing, screenshots, portfolio write-up: 1 week

If the CORS gate (Phase 4) drags, that's a sign the proxy architecture is more complex than expected — flag it early.

---

## Technical decisions baked in

- **Web Audio over visual fallback**: real `AnalyserNode` data is non-negotiable for the deployed build, even if it means delaying meter shipping until Phase 4 clears
- **Vercel serverless**: keeps infrastructure cost at zero and simplifies `/api` routing
- **Dual build from one source**: the artifact target teaches discipline (no framework bloat), the deployed target proves architecture
- **OKLCH tokens throughout**: future-proofs color work, shows systematic thinking
- **Amber phosphor, not green**: matches the hardware era (Sony ES used amber; green is classic Technics/Pioneer territory)

---

## What "done" looks like

A visitor lands on the project, sees a faceplate that reads as hardware, clicks play, watches a segmented meter respond in real time to a Chopin nocturne or Duke Ellington track, and immediately understands: this person knows how to bridge design and signal processing. They can make both look intentional.

The artifact version sits in a portfolio drop, works without a server, and doesn't pretend the meter is real — it's honest about the fallback. The deployed version has no fallbacks; the meter *is* real.

Portfolio narrative: "One codebase, two targets. Same design language, different infrastructure. This taught me why architects think about the proxy layer before the UI."
