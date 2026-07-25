<script lang="ts">
	/* No <form> per constraints — plain input, Enter-key handling wired in phase 6. */
</script>

<div class="search-bar">
	<input
		class="search-input"
		type="text"
		placeholder="SEARCH ARCHIVE.ORG"
		aria-label="Search Internet Archive"
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

	.search-input::placeholder {
		color: var(--display-amber-mid);
		opacity: 0.7;
	}

	.search-input:focus-visible {
		outline: 2px solid var(--btn-active);
		outline-offset: 2px;
	}
</style>
