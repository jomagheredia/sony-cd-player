<script lang="ts">
	interface Props {
		channel: 'L' | 'R';
		/** Segments lit, 0-14. Static/example in the phase-1 shell — driven by AnalyserNode from phase 5 on. */
		level?: number;
	}

	let { channel, level = 0 }: Props = $props();

	const SEGMENT_COUNT = 14;
	const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => i + 1);

	function segmentColor(position: number): string {
		if (position <= 10) return 'var(--display-amber)';
		if (position <= 12) return 'var(--display-amber-mid)';
		return 'var(--display-peak)';
	}
</script>

<div class="meter-row">
	<span class="meter-label">{channel}</span>
	<div class="meter-segments">
		{#each segments as position (position)}
			<span
				class="segment"
				class:lit={position <= level}
				style:--segment-color={segmentColor(position)}
			></span>
		{/each}
	</div>
</div>

<style>
	.meter-row {
		display: flex;
		align-items: center;
		gap: calc(var(--space) * 2);
	}

	.meter-label {
		font-family: 'Share Tech Mono', monospace;
		color: var(--text-label);
		font-size: 0.65rem;
		width: 1ch;
	}

	.meter-segments {
		flex: 1;
		display: flex;
		gap: 3px;
	}

	.segment {
		flex: 1;
		height: 10px;
		background: var(--display-dim);
		border-radius: 0;
	}

	.segment.lit {
		background: var(--segment-color);
	}
</style>
