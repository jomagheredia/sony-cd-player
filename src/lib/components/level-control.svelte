<script lang="ts">
	import { engine } from '$lib/audio/engine';
	import { power } from '$lib/state/power.svelte';
	import { queue } from '$lib/state/queue.svelte';

	/* The faceplate has a LINE OUT level control. Volume was already adjustable with the
	   arrow keys but had no visible state — this is the missing half of that feature. */

	const inert = $derived(!power.ready);
	const percent = $derived(Math.round(queue.volume * 100));

	function onInput(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value) / 100;
		queue.volume = value;
		engine.setVolume(queue.volume);
	}
</script>

<div class="level">
	<span class="level-silk">Line out level</span>
	<input
		class="level-fader"
		type="range"
		min="0"
		max="100"
		step="1"
		value={percent}
		disabled={inert}
		aria-label="Line out level"
		aria-valuetext="{percent} percent"
		oninput={onInput}
		style:--fill="{percent}%"
	/>
</div>

<style>
	.level {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xs);
		width: 132px;
		flex-shrink: 0;
	}

	.level-silk {
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--text-label);
	}

	.level-fader {
		width: 100%;
		height: 14px;
		margin: 0;
		background: transparent;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
	}

	.level-fader:disabled {
		cursor: default;
	}

	.level-fader::-webkit-slider-runnable-track {
		height: 2px;
		background: linear-gradient(
			to right,
			var(--gold-dim) 0 var(--fill),
			var(--chassis-groove) var(--fill) 100%
		);
	}

	.level-fader::-moz-range-track {
		height: 2px;
		background: linear-gradient(
			to right,
			var(--gold-dim) 0 var(--fill),
			var(--chassis-groove) var(--fill) 100%
		);
	}

	/* Rectangular fader cap, no rounding — same grammar as the transport keys. */
	.level-fader::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 5px;
		height: 14px;
		margin-top: -6px;
		border: 0;
		border-radius: 1px;
		background: var(--btn-text);
	}

	.level-fader::-moz-range-thumb {
		width: 5px;
		height: 14px;
		border: 0;
		border-radius: 1px;
		background: var(--btn-text);
	}

	.level-fader:disabled::-webkit-slider-thumb {
		background: oklch(34% 0.008 260);
	}

	.level-fader:disabled::-moz-range-thumb {
		background: oklch(34% 0.008 260);
	}

	/* The fill has to recede in standby too, or it stays the brightest thing on a dark faceplate. */
	.level-fader:disabled::-webkit-slider-runnable-track {
		background: linear-gradient(
			to right,
			oklch(30% 0.025 88) 0 var(--fill),
			var(--chassis-groove) var(--fill) 100%
		);
	}

	.level-fader:disabled::-moz-range-track {
		background: linear-gradient(
			to right,
			oklch(30% 0.025 88) 0 var(--fill),
			var(--chassis-groove) var(--fill) 100%
		);
	}

	.level-fader:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 3px;
	}
</style>
