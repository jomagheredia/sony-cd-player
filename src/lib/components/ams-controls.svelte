<script lang="ts">
	import { playback } from '$lib/state/playback.svelte';
	import { power } from '$lib/state/power.svelte';

	const inert = $derived(!power.ready);
</script>

<div class="ams-controls" aria-label="Automatic music sensor controls">
	<div class="ams-row">
		<button
			type="button"
			class="ams-key btn-proud"
			aria-label="Scan backward"
			disabled={inert}
			onclick={() => playback.seekBy(-5)}
		>
			◄◄
		</button>
		<button
			type="button"
			class="ams-key btn-proud"
			aria-label="Scan forward"
			disabled={inert}
			onclick={() => playback.seekBy(5)}
		>
			►►
		</button>
	</div>

	<span class="ams-label">AMS</span>

	<div class="ams-row">
		<button
			type="button"
			class="ams-key btn-proud"
			aria-label="Previous track"
			disabled={inert}
			onclick={playback.previous}
		>
			|◄◄
		</button>
		<button
			type="button"
			class="ams-key btn-proud"
			aria-label="Next track"
			disabled={inert}
			onclick={playback.next}
		>
			►►|
		</button>
	</div>
</div>

<style>
	.ams-controls {
		width: 96px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.ams-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-2xs);
	}

	.ams-label {
		align-self: center;
		font-family: var(--font-silk);
		font-size: 0.48rem;
		letter-spacing: 0.16em;
		color: var(--text-label);
		line-height: 1;
	}

	.ams-key {
		min-width: 0;
		height: 18px;
		padding: 0 var(--space-2xs);
		border: 1px solid var(--btn-border);
		border-radius: var(--radius);
		background: var(--btn-surface);
		color: var(--btn-text);
		font-family: var(--font-vfd);
		font-size: var(--type-silk);
		line-height: 1;
		cursor: pointer;
		transition:
			transform 80ms var(--ease-out-quart),
			background 140ms var(--ease-out-quart),
			border-color 140ms var(--ease-out-quart),
			box-shadow 80ms var(--ease-out-quart);
	}

	.ams-key:hover:not(:disabled) {
		background: var(--btn-surface-hi);
		border-color: var(--text-label);
	}

	.ams-key:active:not(:disabled) {
		transform: scale(0.96);
	}

	.ams-key:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 2px;
	}

	.ams-key:disabled {
		cursor: default;
		color: var(--chassis-edge);
		border-color: var(--chassis-panel-hi);
		background: var(--chassis-bg);
		box-shadow: none;
	}

	@media (max-width: 900px) {
		.ams-controls {
			width: 112px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ams-key {
			transition: none;
		}
	}
</style>
