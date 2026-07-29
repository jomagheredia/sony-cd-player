<script lang="ts">
	import { searchTracksProgressive } from '$lib/api/client';
	import { queue } from '$lib/state/queue.svelte';
	import { ui } from '$lib/state/ui.svelte';

	/* No <form> per constraints — Enter key triggers search.
	   Hits return fast; stream URLs resolve in small batches so results appear early. */

	let query = $state('');
	let busy = $state(false);

	async function runSearch() {
		const q = query.trim();
		if (!q || busy) return;
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
		disabled={busy}
	/>
</div>

<style>
	.search-bar {
		display: flex;
	}

	.search-input {
		flex: 1;
		background: var(--display-bg);
		border: 1px solid var(--display-amber);
		border-radius: var(--radius);
		color: var(--display-amber);
		font-family: 'Share Tech Mono', monospace;
		font-size: 0.8rem;
		padding: calc(var(--space) * 2) calc(var(--space) * 3);
	}

	.search-input:disabled {
		opacity: 0.6;
	}

	.search-input::placeholder {
		color: var(--display-amber-mid);
		opacity: 0.7;
	}

	.search-input:focus-visible {
		outline: 2px solid var(--btn-active);
		outline-offset: 2px;
	}
</style>
