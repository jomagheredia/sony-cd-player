# Changelog — CDP-XA7ES

Short entries after each build phase: what shipped, what's still open. Newest first.

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
