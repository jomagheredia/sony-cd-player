<script lang="ts">
	import { queue } from '$lib/state/queue.svelte';

	const percent = $derived(Math.round(queue.volume * 100));
	const angle = $derived(-135 + queue.volume * 270);
	// TODO(phase-D): add drag interaction to the rotary level control.
</script>

<div class="level" role="img" aria-label="Line out and phone level: {percent} percent">
	<span class="level-silk">Line Out</span>
	<div class="knob-scale" aria-hidden="true">
		<span class="scale-mark scale-mark--zero">0</span>
		<div class="level-knob" style:transform="rotate({angle}deg)">
			<span class="knob-index"></span>
		</div>
		<span class="scale-mark scale-mark--ten">10</span>
	</div>
	<span class="level-silk">Phone Level</span>
</div>

<style>
	.level {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		width: 68px;
		flex-shrink: 0;
	}

	.level-silk {
		font-family: var(--font-silk);
		font-size: 0.42rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-label);
		line-height: 1.1;
		white-space: nowrap;
	}

	.knob-scale {
		position: relative;
		width: 100%;
		height: 36px;
		margin-block: 1px;
	}

	.level-knob {
		position: absolute;
		left: 50%;
		top: 0;
		width: 32px;
		height: 32px;
		box-sizing: border-box;
		margin-left: -16px;
		border: 1px solid var(--btn-border);
		border-radius: 50%;
		background: var(--btn-surface-hi);
		box-shadow:
			inset 0 1px 0 var(--face-highlight),
			inset 0 -2px 0 var(--face-shadow);
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
		font-size: 0.42rem;
		color: var(--text-label);
		line-height: 1;
	}

	.scale-mark--zero {
		left: 0;
	}

	.scale-mark--ten {
		right: 0;
	}
</style>
