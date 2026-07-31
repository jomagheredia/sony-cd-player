<script lang="ts">
	import { searchTracksProgressive } from '$lib/api/client';
	import { power } from '$lib/state/power.svelte';
	import { queue } from '$lib/state/queue.svelte';
	import { ui } from '$lib/state/ui.svelte';

	/* No <form> per constraints — Enter key or the SEARCH key triggers a run.
	   Hits return fast; stream URLs resolve in small batches so results appear early. */

	let query = $state('');
	let busy = $state(false);

	const inert = $derived(!power.ready);

	async function runSearch() {
		const q = query.trim();
		if (!q || busy || inert) return;
		busy = true;
		ui.setSearching();
		let added = 0;
		let gotHits = false;
		try {
			const totalResolved = await searchTracksProgressive(q, (tracks) => {
				if (!gotHits) {
					gotHits = true;
					ui.clear();
				}
				added += queue.append(tracks);
			});
			if (!gotHits || totalResolved === 0 || added === 0) {
				ui.setNoResults();
			}
		} catch {
			ui.setNoResults();
		} finally {
			busy = false;
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void runSearch();
		}
	}
</script>

<div class="search-bar">
	<input
		class="search-input"
		type="text"
		placeholder="SEARCH ARCHIVE.ORG"
		aria-label="Search Internet Archive"
		bind:value={query}
		onkeydown={onKeydown}
		disabled={busy || inert}
	/>
	<button
		type="button"
		class="search-key"
		disabled={busy || inert || query.trim().length === 0}
		onclick={runSearch}
	>
		{busy ? 'BUSY' : 'SEARCH'}
	</button>
</div>

<style>
	.search-bar {
		display: flex;
		gap: var(--space-xs);
		min-width: 0;
	}

	.search-input {
		flex: 1;
		min-width: 0;
		background: var(--display-bg-deep);
		border: 1px solid var(--chassis-edge);
		border-radius: var(--radius);
		color: var(--phosphor);
		font-family: var(--font-vfd);
		font-size: var(--type-sm);
		letter-spacing: 0.06em;
		padding: var(--space-xs) var(--space-sm);
		box-shadow: inset 0 1px 3px oklch(0% 0 0 / 0.6);
		transition: border-color 140ms var(--ease-out-quart);
	}

	.search-input:hover:not(:disabled) {
		border-color: var(--text-label);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--phosphor-mid);
	}

	.search-input:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 2px;
	}

	.search-input::placeholder {
		color: var(--phosphor-low);
		opacity: 1;
	}

	.search-input:disabled {
		color: var(--phosphor-low);
		border-color: oklch(22% 0.007 260);
	}

	.search-key {
		flex-shrink: 0;
		background: var(--btn-surface);
		border: 1px solid var(--btn-border);
		border-radius: var(--radius);
		color: var(--btn-text);
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		letter-spacing: 0.18em;
		padding: 0 var(--space-sm);
		cursor: pointer;
		transition:
			transform 80ms var(--ease-out-quart),
			background 140ms var(--ease-out-quart),
			border-color 140ms var(--ease-out-quart);
	}

	.search-key:hover:not(:disabled) {
		background: var(--btn-surface-hi);
		border-color: var(--text-label);
	}

	.search-key:active:not(:disabled) {
		transform: scale(0.96);
	}

	.search-key:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 2px;
	}

	.search-key:disabled {
		cursor: default;
		color: oklch(38% 0.008 260);
		border-color: oklch(24% 0.007 260);
	}

	@media (prefers-reduced-motion: reduce) {
		.search-input,
		.search-key {
			transition: none;
		}
	}
</style>
