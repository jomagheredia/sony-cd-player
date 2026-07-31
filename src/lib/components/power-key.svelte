<script lang="ts">
	import { power } from '$lib/state/power.svelte';

	const isOn = $derived(power.phase !== 'standby');
</script>

<div class="power-cluster">
	<div class="power-stack">
		<button
			type="button"
			class="power-key"
			class:on={isOn}
			aria-label="Power"
			aria-pressed={isOn}
			onclick={() => power.toggle()}
		>
			<span class="power-pilot" aria-hidden="true"></span>
			<span class="power-glyph" aria-hidden="true">⏻</span>
		</button>
		<span class="power-silk">POWER</span>
	</div>

	<!-- The gold block sits beside POWER on the real faceplate: ES-series marking, not ornament. -->
	<span class="gold-block" aria-hidden="true"></span>
</div>

<style>
	.power-cluster {
		display: flex;
		align-items: start;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	.power-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2xs);
	}

	.power-key {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		width: 56px;
		height: 30px;
		padding: 0;
		cursor: pointer;
		border: 1px solid var(--btn-border);
		border-radius: var(--radius);
		/* Lighter face than any other control — in standby this is the only live thing. */
		background: var(--btn-surface-hi);
		box-shadow: inset 0 1px 0 oklch(100% 0 0 / 0.04);
		transition:
			transform 80ms var(--ease-out-quart),
			background 160ms var(--ease-out-quart),
			border-color 160ms var(--ease-out-quart);
	}

	.power-key:hover {
		border-color: var(--text-label);
		background: oklch(29% 0.007 260);
	}

	.power-key:active {
		transform: scale(0.96);
	}

	.power-key:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 3px;
	}

	.power-glyph {
		color: var(--btn-text);
		font-size: 0.8rem;
		line-height: 1;
	}

	.power-pilot {
		width: 5px;
		height: 5px;
		background: var(--segment-off);
		transition: background 300ms var(--ease-out-quart);
	}

	.power-key.on .power-pilot {
		background: var(--phosphor);
	}

	.power-silk {
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		letter-spacing: 0.18em;
		color: var(--text-label);
		text-transform: uppercase;
	}

	.gold-block {
		width: 14px;
		height: 18px;
		margin-top: 6px;
		background: var(--gold-dim);
		border-top: 1px solid var(--gold);
		border-radius: 1px;
	}

	@media (prefers-reduced-motion: reduce) {
		.power-key,
		.power-pilot {
			transition: none;
		}
	}
</style>
