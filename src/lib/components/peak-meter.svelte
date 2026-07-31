<script lang="ts">
	import { SEGMENT_COUNT } from '$lib/audio/metering';

	interface Props {
		channel: 'L' | 'R';
		/** Segments lit, 0–14. Driven by AnalyserNode metering (peak-hold included). */
		level?: number;
		/** Power-on segment test: every segment strikes in sequence, then holds. */
		selfTest?: boolean;
	}

	let { channel, level = 0, selfTest = false }: Props = $props();

	const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => i + 1);

	/* Intensity climbs with level: amber through most of the scale, hotter near the
	   top, red over -9dB. Ascending heat is how the hardware reads as an instrument. */
	function segmentColor(position: number): string {
		if (position <= 9) return 'var(--phosphor)';
		if (position <= 11) return 'var(--phosphor-bright)';
		return 'var(--phosphor-peak)';
	}
</script>

<!-- The right channel strikes a beat later than the left, so the test reads as two rows, not one bar. -->
<div class="meter-row" style:--sweep-offset={channel === 'R' ? '70ms' : '0ms'}>
	<span class="meter-label">{channel}</span>
	<div class="meter-segments" class:self-test={selfTest}>
		{#each segments as position (position)}
			<span
				class="segment"
				class:lit={selfTest || position <= level}
				style:--segment-color={segmentColor(position)}
				style:--i={position - 1}
			></span>
		{/each}
	</div>
</div>

<style>
	.meter-row {
		display: flex;
		align-items: center;
		gap: var(--meter-gap, var(--space-xs));
	}

	.meter-label {
		font-family: var(--font-vfd);
		color: var(--phosphor-low);
		font-size: var(--type-silk);
		width: var(--meter-label-w, 1.1ch);
		flex-shrink: 0;
	}

	.meter-segments {
		flex: 1;
		min-width: 0;
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		gap: var(--segment-gap, 3px);
	}

	.segment {
		height: var(--segment-height, 14px);
		/* Unlit segments are structure, not light. Parent overrides this to nothing in standby. */
		background-color: var(--segment-off-live, var(--segment-off));
	}

	.segment.lit {
		background-color: var(--segment-color);
	}

	.self-test .segment.lit {
		animation: segment-strike 90ms var(--ease-out-quart) both;
		animation-delay: calc(var(--i) * 22ms + var(--sweep-offset, 0ms));
	}

	@keyframes segment-strike {
		from {
			background-color: var(--segment-off);
		}
		to {
			background-color: var(--segment-color);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.self-test .segment.lit {
			animation: none;
		}
	}
</style>
