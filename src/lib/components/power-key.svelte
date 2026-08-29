<script lang="ts">
	import { power } from '$lib/state/power.svelte';

	const isOn = $derived(power.phase !== 'standby');
</script>

<div class="power-cluster">
	<div class="power-row">
		<button
			type="button"
			class="power-key btn-proud"
			class:on={isOn}
			aria-label="Power"
			aria-pressed={isOn}
			onclick={() => power.toggle()}
		>
			POWER
		</button>

		<!-- The gold block sits beside POWER on the real faceplate: ES-series marking, not ornament. -->
		<span class="gold-block" aria-hidden="true"></span>
	</div>

	<span class="power-silk">⌐ON&nbsp;&nbsp;⌐OFF</span>
</div>

<style>
	.power-cluster {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2xs);
		flex-shrink: 0;
	}

	.power-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.power-key {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 32px;
		padding: 0;
		cursor: pointer;
		border: 1px solid var(--btn-border);
		border-radius: var(--radius);
		/* Lighter face than any other control — in standby this is the only live thing. */
		background: var(--btn-surface-hi);
		color: var(--btn-text);
		font-family: var(--font-silk);
		font-size: 0.5rem;
		letter-spacing: 0.08em;
		transition:
			transform 80ms var(--ease-out-quart),
			background 160ms var(--ease-out-quart),
			border-color 160ms var(--ease-out-quart),
			box-shadow 80ms var(--ease-out-quart);
	}

	.power-key:hover {
		border-color: var(--text-label);
		background: var(--btn-border);
	}

	.power-key:active {
		transform: scale(0.96);
	}

	.power-key:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 3px;
	}

	.power-key.on {
		border-color: var(--gold-dim);
	}

	.power-silk {
		font-family: var(--font-silk);
		font-size: 0.45rem;
		letter-spacing: 0.08em;
		color: var(--text-label);
		text-transform: uppercase;
	}

	.gold-block {
		width: 14px;
		height: 18px;
		background: var(--gold-dim);
		border-top: 1px solid var(--gold);
		border-radius: 1px;
	}

	@media (prefers-reduced-motion: reduce) {
		.power-key {
			transition: none;
		}
	}
</style>
