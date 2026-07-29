<script lang="ts">
	import PeakMeter from './peak-meter.svelte';
	import { meter } from '$lib/audio/meter.svelte';
	import { playback } from '$lib/state/playback.svelte';
	import { queue } from '$lib/state/queue.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { formatTime } from '$lib/format-time';

	const MARQUEE_CHARS = 28;

	/* Display is a pure function of playback + meter + ui flash state. */

	const state = $derived(playback.current);
	const track = $derived('trackIndex' in state ? queue.tracks[state.trackIndex] : undefined);
	const trackNumber = $derived(
		'trackIndex' in state ? String(state.trackIndex + 1).padStart(2, '0') : '--'
	);

	const playbackBadge = $derived(
		{
			empty: 'NO DISC',
			loading: 'LOAD',
			ready: 'STOP',
			playing: 'PLAY',
			paused: 'PAUSE',
			error: 'DISC ERR'
		}[state.status]
	);

	const flash = $derived(ui.flash);
	const badgeText = $derived(
		flash === 'searching' ? 'SEARCHING' : flash === 'no-results' ? 'NO RESULTS' : playbackBadge
	);
	const showLoadDots = $derived(
		flash === 'searching' || (flash == null && state.status === 'loading')
	);

	const titleText = $derived(track?.title ?? '');
	const useMarquee = $derived(titleText.length > MARQUEE_CHARS);

	const elapsed = $derived('trackIndex' in state ? formatTime(playback.currentTime) : '--:--');
	const totalSeconds = $derived(
		playback.duration > 0 ? playback.duration : (track?.duration ?? undefined)
	);
	const total = $derived(formatTime(totalSeconds));
	const seekPercent = $derived(
		totalSeconds && totalSeconds > 0
			? Math.min(100, (playback.currentTime / totalSeconds) * 100)
			: 0
	);
	const canSeek = $derived(
		state.status === 'playing' || state.status === 'paused' || state.status === 'ready'
	);

	const levelL = $derived(meter.left);
	const levelR = $derived(meter.right);

	function onSeekClick(event: MouseEvent) {
		if (!canSeek) return;
		const el = event.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		if (rect.width <= 0) return;
		playback.seek((event.clientX - rect.left) / rect.width);
	}

	function onSeekKeydown(event: KeyboardEvent) {
		if (!canSeek) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			const total = totalSeconds && totalSeconds > 0 ? totalSeconds : 0;
			if (total <= 0) return;
			playback.seek(Math.max(0, playback.currentTime - 5) / total);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			const total = totalSeconds && totalSeconds > 0 ? totalSeconds : 0;
			if (total <= 0) return;
			playback.seek(Math.min(total, playback.currentTime + 5) / total);
		}
	}
</script>

<div class="display">
	<div class="display-scanlines" aria-hidden="true"></div>

	<div class="display-row display-row--status">
		<span class="track-number">TRACK {trackNumber}</span>
		<span
			class="status-badge"
			class:blink-slow={flash == null && state.status === 'empty'}
			class:blink-thrice={flash == null && state.status === 'error'}
			aria-live="polite"
		>
			{badgeText}{#if showLoadDots}<span class="dots" aria-hidden="true">
					<span>·</span><span>·</span><span>·</span>
				</span>{/if}
		</span>
	</div>

	<div class="display-row display-row--title">
		<div class="track-title" class:marquee={useMarquee}>
			<span class="track-title-inner">{titleText}</span>
			{#if useMarquee}
				<span class="track-title-inner" aria-hidden="true">{titleText}</span>
			{/if}
		</div>
	</div>

	<div class="display-row display-row--meter">
		<PeakMeter channel="L" level={levelL} />
		<PeakMeter channel="R" level={levelR} />
	</div>

	<div class="display-row display-row--time">
		<span class="time-elapsed">{elapsed}</span>
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

<style>
	.display {
		position: relative;
		background: var(--display-bg);
		border-radius: var(--radius);
		padding: calc(var(--space) * 4);
		box-shadow:
			inset 0 0 24px oklch(0% 0 0 / 0.85),
			0 0 10px oklch(82% 0.16 72 / 0.06);
		display: flex;
		flex-direction: column;
		gap: calc(var(--space) * 3);
		overflow: hidden;
	}

	.display-scanlines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
		background: repeating-linear-gradient(
			to bottom,
			oklch(0% 0 0 / 0.18) 0px,
			oklch(0% 0 0 / 0.18) 1px,
			transparent 1px,
			transparent 3px
		);
	}

	.display-row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.track-number {
		font-family: 'Share Tech Mono', monospace;
		color: var(--display-amber);
		font-size: 1.1rem;
	}

	.status-badge {
		font-family: 'Share Tech Mono', monospace;
		color: var(--display-amber-mid);
		font-size: 0.8rem;
		letter-spacing: 0.15em;
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

	.track-title {
		font-family: 'Share Tech Mono', monospace;
		color: var(--display-amber);
		font-size: 1rem;
		white-space: nowrap;
		overflow: hidden;
		max-width: 100%;
		min-height: 1.5em;
		width: 100%;
	}

	.track-title:not(.marquee) .track-title-inner {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-title.marquee {
		display: flex;
		width: 100%;
	}

	.track-title.marquee .track-title-inner {
		flex: 0 0 auto;
		padding-right: 3em;
		animation: title-marquee 14s linear infinite;
	}

	@keyframes title-marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-100%);
		}
	}

	.display-row--meter {
		flex-direction: column;
		gap: calc(var(--space) * 1);
		align-items: stretch;
	}

	.time-elapsed,
	.time-total {
		font-family: 'Share Tech Mono', monospace;
		color: var(--display-dim);
		font-size: 0.75rem;
	}

	.seek-track {
		position: relative;
		flex: 1;
		height: 2px;
		margin: 0 calc(var(--space) * 3);
		background: var(--display-dim);
	}

	.seek-track--active {
		cursor: pointer;
	}

	.seek-track:focus-visible {
		outline: 2px solid var(--btn-active);
		outline-offset: 4px;
	}

	.seek-fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--display-amber);
	}

	.seek-handle {
		position: absolute;
		top: 50%;
		width: 6px;
		height: 6px;
		background: var(--display-amber);
		border-radius: 50%;
		transform: translate(-50%, -50%);
	}

	@media (prefers-reduced-motion: reduce) {
		.status-badge.blink-slow,
		.status-badge.blink-thrice,
		.dots span,
		.track-title.marquee .track-title-inner {
			animation: none;
		}
	}
</style>
