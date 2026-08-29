<script lang="ts">
	import { queue } from '$lib/state/queue.svelte';

	const percent = $derived(Math.round(queue.volume * 100));
	const angle = $derived(-135 + queue.volume * 270);
	// TODO(phase-D): add drag interaction to the rotary level control.
</script>

<div class="level" role="img" aria-label="Line out and phone level: {percent} percent">
	<span class="level-silk">Line Out</span>
	<span class="level-silk">Phone Level</span>
	<div class="knob-scale" aria-hidden="true">
		<span class="scale-mark scale-mark--zero">0</span>
		<div class="level-knob" style:transform="rotate({angle}deg)">
			<span class="knob-index"></span>
		</div>
		<span class="scale-mark scale-mark--ten">10</span>
	</div>
</div>

<style>
	.level {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		width: 74px;
		flex-shrink: 0;
	}

	.level-silk {
		font-family: var(--font-silk);
		font-size: 0.46rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-label);
		line-height: 1.1;
	}

	.knob-scale {
		position: relative;
		width: 100%;
		height: 42px;
		margin-top: 2px;
	}

	.level-knob {
		position: absolute;
		left: 50%;
		top: 1px;
		width: 34px;
		height: 34px;
		box-sizing: border-box;
		margin-left: -17px;
		border: 1px solid var(--btn-border);
		border-radius: 50%;
		background: var(--btn-surface-hi);
		box-shadow:
			inset 0 1px 0 var(--chassis-panel-hi),
			inset 0 -2px 0 var(--chassis-groove);
		transform-origin: center;
	}

	.knob-index {
		position: absolute;
		top: 3px;
		left: 50%;
		width: 1px;
		height: 9px;
		background: var(--gold-dim);
		transform: translateX(-50%);
	}

	.scale-mark {
		position: absolute;
		bottom: 0;
		font-family: var(--font-silk);
		font-size: 0.45rem;
		color: var(--text-label);
		line-height: 1;
	}

	.scale-mark--zero {
		left: 4px;
	}

	.scale-mark--ten {
		right: 1px;
	}
</style>
