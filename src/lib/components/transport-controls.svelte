<script lang="ts">
	import { playback } from '$lib/state/playback.svelte';
	import { queue } from '$lib/state/queue.svelte';

	const isPlaying = $derived(playback.current.status === 'playing');
</script>

<div class="transport">
	<button
		type="button"
		class="transport-btn"
		aria-label="Previous track"
		onclick={playback.previous}
	>
		|◄◄
	</button>
	<button
		type="button"
		class="transport-btn"
		aria-label={isPlaying ? 'Pause' : 'Play'}
		onclick={playback.toggle}
	>
		{isPlaying ? '❙❙' : '►'}
	</button>
	<button type="button" class="transport-btn" aria-label="Stop" onclick={playback.stop}>■</button>
	<button type="button" class="transport-btn" aria-label="Next track" onclick={playback.next}>
		►►|
	</button>
	<button
		type="button"
		class="transport-btn"
		class:toggled={queue.shuffle}
		aria-label="Shuffle"
		aria-pressed={queue.shuffle}
		onclick={() => queue.toggleShuffle()}
	>
		⇌
	</button>
	<button
		type="button"
		class="transport-btn"
		class:toggled={queue.repeat !== 'off'}
		aria-label="Repeat: {queue.repeat}"
		onclick={() => queue.cycleRepeat()}
	>
		↺{#if queue.repeat === 'track'}<span class="repeat-mode">1</span>{/if}
	</button>
</div>

<style>
	.transport {
		display: flex;
		gap: calc(var(--space) * 2);
	}

	.transport-btn {
		flex: 1;
		background: var(--btn-surface);
		border: 1px solid var(--btn-border);
		border-radius: var(--radius);
		color: var(--btn-text);
		font-family: 'Share Tech Mono', monospace;
		font-size: 0.9rem;
		padding: calc(var(--space) * 3) 0;
		cursor: pointer;
		transition: transform 80ms ease-out;
	}

	.transport-btn:active {
		transform: scale(0.96);
	}

	.transport-btn.toggled {
		color: var(--btn-active);
		border-color: var(--btn-active);
	}

	.repeat-mode {
		font-size: 0.6rem;
		vertical-align: super;
	}

	.transport-btn:focus-visible {
		outline: 2px solid var(--btn-active);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.transport-btn {
			transition: none;
		}
	}
</style>
