<script lang="ts">
	import PeakMeter from './peak-meter.svelte';
	import { meter } from '$lib/audio/meter.svelte';
	import { playback } from '$lib/state/playback.svelte';
	import { power } from '$lib/state/power.svelte';
	import { queue } from '$lib/state/queue.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { formatTime } from '$lib/format-time';

	const SELF_TEST_TITLE = '█'.repeat(24);
	/* Scroll speed in px/sec, plus the dwell at each end. Slow enough to read at a glance. */
	const SCROLL_PX_PER_SEC = 38;
	const SCROLL_DWELL_SEC = 3.2;

	/* Display is a pure function of power + playback + meter + ui flash state. */

	const phase = $derived(power.phase);
	const selfTest = $derived(power.selfTest);
	const lit = $derived(power.lit);

	const playbackState = $derived(playback.current);
	const track = $derived(
		'trackIndex' in playbackState ? queue.tracks[playbackState.trackIndex] : undefined
	);

	const playbackBadge = $derived(
		{
			empty: 'NO DISC',
			loading: 'LOAD',
			ready: 'STOP',
			playing: 'PLAY',
			paused: 'PAUSE',
			error: 'DISC ERR'
		}[playbackState.status]
	);

	const flash = $derived(ui.flash);
	const badgeText = $derived(
		selfTest
			? 'TEST'
			: flash === 'searching'
				? 'SEARCHING'
				: flash === 'no-results'
					? 'NO RESULTS'
					: playbackBadge
	);
	const showLoadDots = $derived(
		!selfTest && (flash === 'searching' || (flash == null && playbackState.status === 'loading'))
	);

	const trackNumber = $derived(
		selfTest
			? '88'
			: 'trackIndex' in playbackState
				? String(playbackState.trackIndex + 1).padStart(2, '0')
				: '--'
	);
	const titleText = $derived(selfTest ? SELF_TEST_TITLE : (track?.title ?? ''));

	/* The title scrolls only when it actually overruns the cavity, and only by the
	   amount it overruns — measured, not guessed from character count. A real VFD
	   walks the string to the end, holds, and snaps back; it never loops seamlessly. */
	let titleEl = $state<HTMLElement>();
	let titleBoxWidth = $state(0);
	let titleInkWidth = $state(0);

	$effect(() => {
		titleText;
		titleBoxWidth;
		if (titleEl) titleInkWidth = titleEl.scrollWidth;
	});

	const titleOverflow = $derived(Math.max(0, titleInkWidth - titleBoxWidth));
	const useMarquee = $derived(!selfTest && titleOverflow > 8);
	const marqueeDuration = $derived(
		(titleOverflow / SCROLL_PX_PER_SEC + SCROLL_DWELL_SEC * 2).toFixed(2)
	);

	const elapsed = $derived(
		selfTest ? '88:88' : 'trackIndex' in playbackState ? formatTime(playback.currentTime) : '--:--'
	);
	const totalSeconds = $derived(
		playback.duration > 0 ? playback.duration : (track?.duration ?? undefined)
	);
	const total = $derived(selfTest ? '88:88' : formatTime(totalSeconds));
	const seekPercent = $derived(
		selfTest
			? 100
			: totalSeconds && totalSeconds > 0
				? Math.min(100, (playback.currentTime / totalSeconds) * 100)
				: 0
	);
	const canSeek = $derived(
		power.ready &&
			(playbackState.status === 'playing' ||
				playbackState.status === 'paused' ||
				playbackState.status === 'ready')
	);

	const levelL = $derived(lit ? meter.left : 0);
	const levelR = $derived(lit ? meter.right : 0);

	/* dB marks sit at the segment each threshold actually maps to, given the
	   -48..-3 dB window in metering.ts. A scale that lies is worse than no scale. */
	const dbMarks = [
		{ label: '-40', column: 3 },
		{ label: '-30', column: 6 },
		{ label: '-20', column: 9 },
		{ label: '-10', column: 12 },
		{ label: '-3', column: 14 }
	];

	function onSeekClick(event: MouseEvent) {
		if (!canSeek) return;
		const el = event.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		if (rect.width <= 0) return;
		playback.seek((event.clientX - rect.left) / rect.width);
	}

	function onSeekKeydown(event: KeyboardEvent) {
		if (!canSeek) return;
		const span = totalSeconds && totalSeconds > 0 ? totalSeconds : 0;
		if (span <= 0) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			playback.seek(Math.max(0, playback.currentTime - 5) / span);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			playback.seek(Math.min(span, playback.currentTime + 5) / span);
		}
	}
</script>

<div class="display" data-phase={phase}>
	<div class="display-filament" aria-hidden="true"></div>
	<div class="display-scanlines" aria-hidden="true"></div>

	<div class="display-glyphs">
		<div class="indicator-strip">
			<span class="indicators" aria-hidden="true">
				<span class="indicator" class:on={selfTest || queue.shuffle}>SHUFFLE</span>
				<span class="indicator" class:on={selfTest || queue.repeat === 'all'}>REPEAT</span>
				<span class="indicator" class:on={selfTest || queue.repeat === 'track'}>REPEAT 1</span>
			</span>
			<span
				class="status-badge"
				class:blink-slow={!selfTest && flash == null && playbackState.status === 'empty'}
				class:blink-thrice={!selfTest && flash == null && playbackState.status === 'error'}
				aria-live="polite"
			>
				{badgeText}{#if showLoadDots}<span class="dots" aria-hidden="true">
						<span>·</span><span>·</span><span>·</span>
					</span>{/if}
			</span>
		</div>

		<div class="track-line">
			<span class="track-label">TRACK</span>
			<span class="track-number">{trackNumber}</span>
		</div>

		<div
			class="track-title"
			class:marquee={useMarquee}
			class:ghost={selfTest}
			bind:clientWidth={titleBoxWidth}
			style:--title-overflow="{titleOverflow}px"
			style:--title-duration="{marqueeDuration}s"
		>
			<span class="track-title-inner" bind:this={titleEl}>{titleText}</span>
		</div>

		<div class="meter-group">
			<div class="meter-scale" aria-hidden="true">
				<span class="meter-scale-unit">dB</span>
				<div class="meter-scale-marks">
					{#each dbMarks as mark (mark.label)}
						<span class="meter-scale-mark" style:grid-column={mark.column}>{mark.label}</span>
					{/each}
				</div>
			</div>
			<PeakMeter channel="L" level={levelL} {selfTest} />
			<PeakMeter channel="R" level={levelR} {selfTest} />
		</div>

		<div class="time-row">
			<span class="time-elapsed">{elapsed}</span>
			<div class="seek-column">
				<div
					class="seek-track"
					class:seek-track--active={canSeek}
					role="slider"
					tabindex={canSeek ? 0 : -1}
					aria-label="Seek"
					aria-valuemin={0}
					aria-valuemax={Math.floor(totalSeconds ?? 0)}
					aria-valuenow={Math.floor(playback.currentTime)}
					aria-disabled={!canSeek}
					onclick={onSeekClick}
					onkeydown={onSeekKeydown}
				>
					<div class="seek-fill" style:width="{seekPercent}%"></div>
					<div class="seek-handle" style:left="{seekPercent}%"></div>
				</div>
				<span class="time-total">{total}</span>
			</div>
		</div>
	</div>
</div>

<style>
	.display {
		--meter-gap: var(--space-xs);
		--meter-label-w: 1.1ch;
		--segment-gap: 3px;
		--segment-height: 14px;

		position: relative;
		background: var(--display-bg-deep);
		border-radius: var(--radius);
		padding: var(--space-md) var(--space-lg);
		min-width: 0;
		box-sizing: border-box;
		overflow: hidden;
		/* Recessed cavity: dark ring, then a lip of light where the bezel catches the room. */
		box-shadow:
			inset 0 2px 6px oklch(0% 0 0 / 0.9),
			inset 0 0 30px oklch(0% 0 0 / 0.8),
			0 0 0 1px var(--chassis-groove),
			0 1px 0 var(--chassis-panel-hi);
		transition: background 420ms var(--ease-out-quart);
	}

	.display[data-phase='energize'],
	.display[data-phase='self-test'],
	.display[data-phase='on'] {
		background: var(--display-bg);
	}

	/* Filament bloom — the cavity fills with light before any glyph appears. */
	.display-filament {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		opacity: 0;
		background: radial-gradient(
			ellipse 120% 90% at 50% 55%,
			oklch(82% 0.16 72 / 0.12),
			transparent 72%
		);
		transition: opacity 500ms var(--ease-out-quart);
	}

	.display[data-phase='energize'] .display-filament {
		animation: filament-strike 340ms var(--ease-out-expo) forwards;
	}

	.display[data-phase='self-test'] .display-filament,
	.display[data-phase='on'] .display-filament {
		opacity: 0.18;
	}

	/* Overshoot on strike, then settle low — the cavity has to stay black enough that
	   the phosphor is the only thing reading as light. */
	@keyframes filament-strike {
		0% {
			opacity: 0;
		}
		45% {
			opacity: 0.9;
		}
		62% {
			opacity: 0.3;
		}
		100% {
			opacity: 0.18;
		}
	}

	.display-scanlines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 3;
		background: repeating-linear-gradient(
			to bottom,
			oklch(0% 0 0 / 0.18) 0px,
			oklch(0% 0 0 / 0.18) 1px,
			transparent 1px,
			transparent 3px
		);
	}

	.display-glyphs {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		opacity: 0;
		transition: opacity 240ms var(--ease-out-quart);
	}

	.display[data-phase='self-test'] .display-glyphs,
	.display[data-phase='on'] .display-glyphs {
		opacity: 1;
	}

	/* Standby: unlit segments vanish entirely, as on a powered-down VFD. */
	.display[data-phase='standby'],
	.display[data-phase='energize'] {
		--segment-off-live: transparent;
	}

	.indicator-strip {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.indicators {
		display: flex;
		gap: var(--space-sm);
		min-width: 0;
	}

	.indicator {
		font-family: var(--font-vfd);
		font-size: var(--type-silk);
		letter-spacing: 0.16em;
		color: var(--segment-off);
		white-space: nowrap;
		transition: color 160ms var(--ease-out-quart);
	}

	.indicator.on {
		color: var(--phosphor-mid);
	}

	.status-badge {
		font-family: var(--font-vfd);
		color: var(--phosphor-mid);
		font-size: var(--type-silk);
		letter-spacing: var(--track-silk);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.status-badge.blink-slow {
		animation: badge-blink 1s steps(1, end) infinite;
	}

	.status-badge.blink-thrice {
		animation: badge-blink 500ms steps(1, end) 3;
	}

	@keyframes badge-blink {
		50% {
			opacity: 0;
		}
	}

	.dots span {
		animation: dot-pulse 900ms ease-in-out infinite;
	}

	.dots span:nth-child(2) {
		animation-delay: 150ms;
	}

	.dots span:nth-child(3) {
		animation-delay: 300ms;
	}

	@keyframes dot-pulse {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 1;
		}
	}

	.track-line {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
	}

	.track-label {
		font-family: var(--font-vfd);
		font-size: var(--type-silk);
		letter-spacing: var(--track-silk);
		color: var(--phosphor-low);
	}

	.track-number {
		font-family: var(--font-digits);
		font-size: var(--type-lg);
		color: var(--phosphor);
		line-height: 1;
	}

	.track-title {
		font-family: var(--font-vfd);
		color: var(--phosphor);
		font-size: var(--type-md);
		letter-spacing: 0.02em;
		white-space: nowrap;
		overflow: hidden;
		width: 100%;
		min-height: 1.4em;
	}

	/* Self-test fills every character cell; the tracking keeps the cell divisions visible
	   so it reads as a display test rather than a progress bar. */
	.track-title.ghost {
		color: var(--phosphor-mid);
		letter-spacing: 3px;
	}

	.track-title-inner {
		display: inline-block;
		white-space: nowrap;
	}

	.track-title.marquee .track-title-inner {
		animation: title-scroll var(--title-duration, 12s) linear infinite;
	}

	/* Dwell, walk to the end, dwell, snap back — the snap is the two stops at 93%. */
	@keyframes title-scroll {
		0%,
		14% {
			transform: translateX(0);
		}
		79%,
		93% {
			transform: translateX(calc(-1 * var(--title-overflow, 0px)));
		}
		93.01%,
		100% {
			transform: translateX(0);
		}
	}

	.meter-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xs);
		min-width: 0;
	}

	.meter-scale {
		display: flex;
		gap: var(--meter-gap);
		align-items: end;
	}

	.meter-scale-unit {
		width: var(--meter-label-w);
		flex-shrink: 0;
		font-family: var(--font-vfd);
		font-size: var(--type-silk);
		color: var(--phosphor-low);
		line-height: 1;
	}

	.meter-scale-marks {
		flex: 1;
		min-width: 0;
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		gap: var(--segment-gap);
	}

	.meter-scale-mark {
		font-family: var(--font-vfd);
		font-size: var(--type-silk);
		color: var(--phosphor-low);
		line-height: 1;
		justify-self: center;
		white-space: nowrap;
	}

	.time-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-md);
		min-width: 0;
	}

	.time-elapsed {
		font-family: var(--font-digits);
		font-size: var(--type-hero);
		/* Slightly under the lit segments so the meter keeps the eye, despite the size. */
		color: var(--phosphor-mid);
		line-height: 0.9;
		flex-shrink: 0;
	}

	.seek-column {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-xs);
		padding-bottom: 0.25em;
	}

	/* Seven-segment glyphs stop being legible at this size, so the total falls back to
	   the VFD mono. The hero digits keep the segmented face. */
	.time-total {
		font-family: var(--font-vfd);
		font-size: var(--type-sm);
		color: var(--phosphor-low);
		align-self: end;
		line-height: 1;
	}

	.seek-track {
		position: relative;
		height: 2px;
		/* Lighter than an unlit meter segment — the groove has to be findable before it fills. */
		background: oklch(28% 0.022 62);
	}

	.seek-track--active {
		cursor: pointer;
	}

	.seek-track:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: 6px;
	}

	.seek-fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--phosphor);
	}

	.seek-handle {
		position: absolute;
		top: 50%;
		width: 2px;
		height: 10px;
		background: var(--phosphor-bright);
		transform: translate(-50%, -50%);
	}

	@media (max-width: 720px) {
		.display {
			--segment-height: 11px;
			padding: var(--space-sm) var(--space-md);
		}

		.time-row {
			gap: var(--space-sm);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.display,
		.display-filament,
		.display-glyphs,
		.indicator {
			transition-duration: 120ms;
		}

		.display[data-phase='energize'] .display-filament {
			animation: none;
			opacity: 0.18;
		}

		.status-badge.blink-slow,
		.status-badge.blink-thrice,
		.dots span,
		.track-title.marquee .track-title-inner {
			animation: none;
		}
	}
</style>
