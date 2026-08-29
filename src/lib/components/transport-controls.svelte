<script lang="ts">
	import { playback } from '$lib/state/playback.svelte';
	import { power } from '$lib/state/power.svelte';

	/* Controls are genuinely inert until the machine has finished warming up. */
	const inert = $derived(!power.ready);
	// TODO(phase-D): split play and pause into distinct handlers

	const programKeys: Array<{ label: string; ariaLabel: string } | null> = [
		{ label: '1', ariaLabel: 'Program track 1' },
		{ label: '2', ariaLabel: 'Program track 2' },
		{ label: '3', ariaLabel: 'Program track 3' },
		{ label: '4', ariaLabel: 'Program track 4' },
		{ label: '5', ariaLabel: 'Program track 5' },
		{ label: 'Digital Output', ariaLabel: 'Digital output' },
		{ label: '6', ariaLabel: 'Program track 6' },
		{ label: '7', ariaLabel: 'Program track 7' },
		{ label: '8', ariaLabel: 'Program track 8' },
		{ label: '9', ariaLabel: 'Program track 9' },
		{ label: '10', ariaLabel: 'Program track 10' },
		null,
		{ label: '11', ariaLabel: 'Program track 11' },
		{ label: '12', ariaLabel: 'Program track 12' },
		{ label: 'Check', ariaLabel: 'Check program' },
		{ label: 'Clear', ariaLabel: 'Clear program' },
		{ label: '>12', ariaLabel: 'Program track greater than 12' },
		{ label: 'Play Mode', ariaLabel: 'Play mode' }
	];
</script>

<div class="transport">
	<div class="program-pad" aria-label="Program controls">
		{#each programKeys as key, index (index)}
			{#if key}
				<div class="program-cell">
					<span class="program-label">{key.label}</span>
					<button type="button" class="program-key" aria-label={key.ariaLabel} disabled={inert}
					></button>
				</div>
			{:else}
				<span class="program-cell" aria-hidden="true"></span>
			{/if}
		{/each}
	</div>

	<div class="transport-row">
		<div class="eject-block">
			<button type="button" class="eject-key" aria-label="Open or close disc tray" disabled={inert}>
				<span class="eject-glyph" aria-hidden="true">△</span>
			</button>
			<span class="eject-label">Open/Close</span>
		</div>

		<div class="main-transport">
			<button
				type="button"
				class="transport-key transport-key--play"
				aria-label="Play"
				disabled={inert}
				onclick={playback.toggle}
			>
				<span class="key-dot" aria-hidden="true"></span>
				<span aria-hidden="true">►</span>
			</button>

			<button
				type="button"
				class="transport-key"
				aria-label="Pause"
				disabled={inert}
				onclick={playback.toggle}
			>
				<span class="key-dot" aria-hidden="true"></span>
				<span aria-hidden="true">❙❙</span>
			</button>

			<button
				type="button"
				class="transport-key"
				aria-label="Stop"
				disabled={inert}
				onclick={playback.stop}
			>
				<span class="key-dot" aria-hidden="true"></span>
				<span aria-hidden="true">■</span>
			</button>
		</div>
	</div>
</div>

<style>
	.transport {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: var(--space-xs);
		min-width: 0;
		height: 100%;
	}

	.program-pad {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		column-gap: var(--space-2xs);
		row-gap: 6px;
		min-width: 0;
	}

	.program-cell {
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
	}

	.program-label {
		width: 100%;
		min-height: 1.1em;
		overflow: visible;
		font-family: var(--font-silk);
		font-size: 0.42rem;
		line-height: 1.1;
		letter-spacing: 0.08em;
		text-align: center;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--text-label);
	}

	.program-key {
		width: 10px;
		height: 10px;
		padding: 0;
		border: 1px solid var(--btn-border);
		border-radius: 50%;
		background: var(--btn-surface-hi);
		cursor: pointer;
		box-shadow: inset 0 1px 0 var(--chassis-panel-hi);
		transition:
			transform 80ms var(--ease-out-quart),
			background 140ms var(--ease-out-quart),
			border-color 140ms var(--ease-out-quart);
	}

	.transport-row {
		display: flex;
		align-items: stretch;
		gap: var(--space-sm);
		min-width: 0;
	}

	.eject-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}

	.eject-label {
		font-family: var(--font-silk);
		font-size: 0.42rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-label);
		line-height: 1;
		white-space: nowrap;
	}

	.main-transport {
		display: flex;
		align-items: stretch;
		gap: var(--space-2xs);
		flex: 1;
		min-width: 0;
	}

	.eject-key,
	.transport-key {
		position: relative;
		height: 34px;
		min-width: 44px;
		padding: 0 var(--space-xs);
		background: var(--btn-surface);
		border: 1px solid var(--btn-border);
		border-radius: var(--radius);
		color: var(--btn-text);
		font-family: var(--font-vfd);
		font-size: 0.8rem;
		line-height: 1;
		cursor: pointer;
		box-shadow: inset 0 1px 0 var(--chassis-panel-hi);
		transition:
			transform 80ms var(--ease-out-quart),
			background 140ms var(--ease-out-quart),
			border-color 140ms var(--ease-out-quart);
	}

	.eject-key {
		width: 34px;
		min-width: 34px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.eject-glyph {
		font-size: 0.58rem;
	}

	.transport-key {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 1 50px;
	}

	.transport-key--play {
		flex: 1 1 82px;
		background: var(--btn-surface-hi);
		color: var(--text-secondary);
	}

	.key-dot {
		position: absolute;
		top: 7px;
		left: 7px;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--btn-border);
	}

	.program-key:hover:not(:disabled),
	.eject-key:hover:not(:disabled),
	.transport-key:hover:not(:disabled) {
		background: var(--btn-surface-hi);
		border-color: var(--text-label);
	}

	.program-key:active:not(:disabled),
	.eject-key:active:not(:disabled),
	.transport-key:active:not(:disabled) {
		transform: scale(0.96);
	}

	.program-key:focus-visible,
	.eject-key:focus-visible,
	.transport-key:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 2px;
	}

	.program-key:disabled,
	.eject-key:disabled,
	.transport-key:disabled {
		cursor: default;
		color: var(--chassis-edge);
		border-color: var(--chassis-panel-hi);
		background: var(--chassis-bg);
		box-shadow: none;
	}

	@media (max-width: 900px) {
		.transport {
			width: min(100%, 400px);
		}

		.program-pad,
		.transport-row {
			width: 100%;
		}
	}

	@media (max-width: 420px) {
		.program-label {
			font-size: 0.38rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.program-key,
		.eject-key,
		.transport-key {
			transition: none;
		}
	}
</style>
