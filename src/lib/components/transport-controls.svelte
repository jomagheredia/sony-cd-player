<script lang="ts">
	import { playback } from '$lib/state/playback.svelte';
	import { power } from '$lib/state/power.svelte';
	import { queue } from '$lib/state/queue.svelte';

	const isPlaying = $derived(playback.current.status === 'playing');
	/* Controls are genuinely inert until the machine has finished warming up. */
	const inert = $derived(!power.ready);
</script>

<div class="transport">
	<div class="key-group">
		<button
			type="button"
			class="key"
			aria-label="Previous track"
			disabled={inert}
			onclick={playback.previous}
		>
			|◄◄
		</button>
		<button
			type="button"
			class="key key--primary"
			aria-label={isPlaying ? 'Pause' : 'Play'}
			disabled={inert}
			onclick={playback.toggle}
		>
			{isPlaying ? '❙❙' : '►'}
		</button>
		<button type="button" class="key" aria-label="Stop" disabled={inert} onclick={playback.stop}>
			■
		</button>
		<button
			type="button"
			class="key"
			aria-label="Next track"
			disabled={inert}
			onclick={playback.next}
		>
			►►|
		</button>
	</div>

	<div class="key-group key-group--mode">
		<button
			type="button"
			class="key key--mode"
			class:toggled={queue.shuffle}
			aria-label="Shuffle"
			aria-pressed={queue.shuffle}
			disabled={inert}
			onclick={() => queue.toggleShuffle()}
		>
			⇌
		</button>
		<button
			type="button"
			class="key key--mode"
			class:toggled={queue.repeat !== 'off'}
			aria-label="Repeat: {queue.repeat}"
			disabled={inert}
			onclick={() => queue.cycleRepeat()}
		>
			↺{#if queue.repeat === 'track'}<span class="repeat-mode">1</span>{/if}
		</button>
	</div>
</div>

<style>
	/* Transport sits to the right of POWER, as on the faceplate — one cluster, not two
	   islands pushed to opposite edges. */
	.transport {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-lg);
		flex-wrap: wrap;
	}

	.key-group {
		display: flex;
		gap: var(--space-xs);
		min-width: 0;
	}

	.key {
		min-width: 52px;
		padding: var(--space-sm) var(--space-md);
		background: var(--btn-surface);
		border: 1px solid var(--btn-border);
		border-radius: var(--radius);
		color: var(--btn-text);
		font-family: var(--font-vfd);
		font-size: 0.9rem;
		line-height: 1;
		cursor: pointer;
		box-shadow: inset 0 1px 0 oklch(100% 0 0 / 0.03);
		transition:
			transform 80ms var(--ease-out-quart),
			background 140ms var(--ease-out-quart),
			border-color 140ms var(--ease-out-quart);
	}

	/* Play is the one key that matters most — wider face, brighter text. */
	.key--primary {
		min-width: 86px;
		background: var(--btn-surface-hi);
		color: var(--text-secondary);
	}

	.key--mode {
		min-width: 44px;
		font-size: 0.8rem;
	}

	.key:hover:not(:disabled) {
		background: var(--btn-surface-hi);
		border-color: var(--text-label);
	}

	.key--primary:hover:not(:disabled) {
		background: oklch(30% 0.007 260);
	}

	.key:active:not(:disabled) {
		transform: scale(0.96);
	}

	.key:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 2px;
	}

	.key:disabled {
		cursor: default;
		color: oklch(38% 0.008 260);
		border-color: oklch(24% 0.007 260);
		background: oklch(16% 0.005 260);
		box-shadow: none;
	}

	.key.toggled:not(:disabled) {
		color: var(--btn-active);
		border-color: var(--btn-active);
	}

	.repeat-mode {
		font-size: 0.6rem;
		vertical-align: super;
	}

	@media (max-width: 720px) {
		.transport {
			gap: var(--space-sm);
		}

		.key {
			flex: 1;
			min-width: 44px;
			padding: var(--space-sm) var(--space-xs);
		}

		.key-group {
			flex: 1 1 auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.key {
			transition: none;
		}
	}
</style>
