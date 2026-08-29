<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/tokens.css';
	import '@fontsource/dseg7-classic/latin-400.css';
	import { DEFAULT_IDS, resolveTracks } from '$lib/api/client';
	import { engine } from '$lib/audio/engine';
	import { playback } from '$lib/state/playback.svelte';
	import { power } from '$lib/state/power.svelte';
	import { queue } from '$lib/state/queue.svelte';
	import AmsControls from './ams-controls.svelte';
	import DisplayPanel from './display-panel.svelte';
	import LevelControl from './level-control.svelte';
	import PowerKey from './power-key.svelte';
	import TransportControls from './transport-controls.svelte';
	import TrackList from './track-list.svelte';

	const phase = $derived(power.phase);

	onMount(() => {
		power.restore();

		/* The disc is in the tray whether or not the machine is on, so the TOC read
		   happens on mount. The LOAD beat in the ceremony reflects this real fetch. */
		void (async () => {
			try {
				const tracks = await resolveTracks([...DEFAULT_IDS]);
				if (tracks.length > 0) queue.tracks = tracks;
			} catch {
				/* Keep empty queue — user can still search. */
			} finally {
				queue.reading = false;
			}
		})();
	});

	function isTypingTarget(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		const tag = target.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (isTypingTarget(event.target)) return;
		/* Nothing but the POWER key responds while the machine is off or warming up. */
		if (!power.ready) return;

		switch (event.key) {
			case ' ':
				event.preventDefault();
				playback.toggle();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				playback.seekBy(-5);
				break;
			case 'ArrowRight':
				event.preventDefault();
				playback.seekBy(5);
				break;
			case 'ArrowUp':
				event.preventDefault();
				engine.setVolume(queue.adjustVolume(0.05));
				break;
			case 'ArrowDown':
				event.preventDefault();
				engine.setVolume(queue.adjustVolume(-0.05));
				break;
			case 'n':
			case 'N':
				event.preventDefault();
				playback.next();
				break;
			case 'p':
			case 'P':
				event.preventDefault();
				playback.previous();
				break;
			case 's':
			case 'S':
				event.preventDefault();
				queue.toggleShuffle();
				break;
			case 'r':
			case 'R':
				event.preventDefault();
				queue.cycleRepeat();
				break;
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="stage">
	<div class="player-stack">
		<div class="machine" data-phase={phase}>
			<header class="header-band">
				<div class="header-cell header-cell--left">
					<span class="brand-sony">Sony</span>
				</div>
				<div class="header-cell header-cell--center">
					<span class="brand-series">
						<span class="series-name">XA7ES</span>
						<span class="series-sub">Current Pulse D/A Convert System</span>
					</span>
				</div>
				<div class="header-cell header-cell--right">
					<span class="digital-label">Digital Out</span>
					<span class="digital-led" aria-hidden="true"></span>
				</div>
			</header>

			<div class="faceplate-grid">
				<section class="faceplate-zone left-zone" aria-label="Power and navigation controls">
					<div class="left-controls">
						<PowerKey />

						<div class="left-service-row">
							<div class="phones">
								<span class="zone-silk">Phones</span>
								<span class="phones-jack" aria-hidden="true"></span>
							</div>
							<LevelControl />
							<AmsControls />
						</div>
					</div>
				</section>

				<section class="faceplate-zone center-zone" aria-label="Disc display">
					<div class="tray-bezel">
						<span class="bezel-screw bezel-screw--left" aria-hidden="true"></span>
						<div class="tray-window">
							<DisplayPanel />
							<span class="disc-mark">Compact Disc Digital Audio</span>
						</div>
						<span class="bezel-screw bezel-screw--right" aria-hidden="true"></span>
					</div>
				</section>

				<section class="faceplate-zone right-zone" aria-label="Program and transport controls">
					<TransportControls />
				</section>
			</div>

			<footer class="rail rail--bottom">
				<span class="model-mark">
					Compact Disc Player&nbsp; CDP-<span class="model-highlight">XA7</span>ES
				</span>
			</footer>
		</div>

		<!-- TODO(phase-E): replaced by the tray loading surface -->
		<div class="track-panel">
			<TrackList />
		</div>
	</div>
</div>

<style>
	:global(html) {
		background: var(--chassis-void);
		color-scheme: dark;
	}

	:global(body) {
		margin: 0;
		background: var(--chassis-void);
	}

	.stage {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: clamp(var(--space-md), 4vw, var(--space-2xl));
		box-sizing: border-box;
	}

	.player-stack {
		width: 100%;
		max-width: 1100px;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.machine {
		position: relative;
		isolation: isolate;
		width: 100%;
		max-width: 1100px;
		aspect-ratio: 430 / 125;
		overflow: hidden;
		min-height: 0;
		box-sizing: border-box;
		font-family: var(--font-silk);
		/* Slightly lighter at the top, falling off into a darker terminal band. */
		background: linear-gradient(
			180deg,
			color-mix(in oklch, var(--chassis-panel) 70%, var(--chassis-panel-hi)) 0%,
			var(--chassis-panel) 22%,
			var(--chassis-panel) 70%,
			var(--face-shadow) 100%
		);
		border: 1px solid var(--chassis-edge);
		border-radius: var(--radius);
		padding: var(--space-sm) var(--space-md) var(--space-xs);
		display: grid;
		grid-template-rows: minmax(0, 0.24fr) minmax(0, 1fr) auto;
		gap: var(--space-xs);
		/* Chamfer catch-light, terminal-band falloff, then the unit sitting in the room. */
		box-shadow:
			inset 0 2px 0 var(--face-highlight),
			inset 0 -8px 12px var(--face-shadow),
			0 30px 70px -30px oklch(0% 0 0 / 0.9);
	}

	/* Brushed grain — one overlay for the whole faceplate. Inset so it does not
	   paint over the chamfer or the terminal band. */
	.machine::before {
		content: '';
		position: absolute;
		top: 2px;
		right: 0;
		bottom: 8px;
		left: 0;
		z-index: -1;
		pointer-events: none;
		background: repeating-linear-gradient(
			0deg,
			var(--face-grain) 0px,
			var(--face-grain) 1px,
			transparent 1px,
			transparent 2px
		);
	}

	/* Cast-iron insulators as they read from the front: two dark blocks in the
	   bottom padding, inside the chassis edge so overflow:hidden does not clip them. */
	.machine::after {
		content: '';
		position: absolute;
		left: 7%;
		right: 7%;
		bottom: 2px;
		height: 5px;
		pointer-events: none;
		background:
			linear-gradient(var(--face-shadow), var(--face-shadow)) left / 26px 5px no-repeat,
			linear-gradient(var(--face-shadow), var(--face-shadow)) right / 26px 5px no-repeat;
	}

	.header-band,
	.faceplate-grid {
		display: grid;
		column-gap: var(--space-sm);
	}

	/* XA7ES sits on the chassis centerline; equal 1fr sides keep it there
	   even when SONY and DIGITAL OUT have different widths. */
	.header-band {
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		min-height: 0;
		align-items: center;
		/* Machined step: dark groove with a 1px highlight directly beneath it. */
		border-bottom: 1px solid var(--face-groove);
		box-shadow: 0 1px 0 var(--face-highlight);
		padding-bottom: var(--space-2xs);
	}

	/* Same centerline as the header mark: equal side columns, tray in the middle. */
	.faceplate-grid {
		grid-template-columns: minmax(0, 3fr) minmax(0, 4fr) minmax(0, 3fr);
		min-height: 0;
	}

	.header-cell {
		min-width: 0;
		display: flex;
		align-items: flex-start;
	}

	.header-cell--center {
		justify-content: center;
	}

	.header-cell--right {
		flex-direction: column;
		align-items: flex-end;
		gap: 3px;
	}

	.brand-sony {
		font-family: var(--font-silk);
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--text-secondary);
		text-shadow:
			0 1px 0 var(--chassis-groove),
			0 -1px 0 var(--chassis-panel-hi);
	}

	.brand-series {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		text-align: center;
	}

	.series-name {
		font-family: var(--font-silk);
		font-size: var(--type-sm);
		font-weight: 600;
		letter-spacing: 0.14em;
		color: var(--gold);
	}

	.series-sub {
		font-family: var(--font-silk);
		font-size: 0.5rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--text-label);
	}

	.digital-label {
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--text-label);
	}

	.digital-led {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		border: 1px solid var(--chassis-edge);
		background: var(--chassis-groove);
	}

	.left-service-row,
	.center-zone,
	.right-zone {
		transition: opacity 420ms var(--ease-out-quart);
	}

	/* Powered down, the controls recede; POWER stays at full contrast as the only live control. */
	.machine[data-phase='standby'] .left-service-row,
	.machine[data-phase='standby'] .center-zone,
	.machine[data-phase='standby'] .right-zone {
		opacity: 0.5;
	}

	.faceplate-zone {
		min-width: 0;
		min-height: 0;
	}

	.left-zone {
		padding: var(--space-xs) var(--space-sm) var(--space-xs) 0;
	}

	.left-controls {
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		height: 100%;
		min-height: 0;
	}

	.left-controls :global(.power-cluster) {
		align-self: start;
	}

	.left-service-row {
		display: flex;
		align-items: flex-end;
		gap: var(--space-xs);
		min-width: 0;
	}

	.left-service-row :global(.ams-controls) {
		margin-left: auto;
		flex-shrink: 0;
	}

	.phones {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2xs);
	}

	.phones-jack {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		box-sizing: border-box;
		border: 3px solid var(--gold-dim);
		border-radius: 50%;
		background: var(--btn-recess);
		box-shadow:
			inset 0 1px 1px var(--face-shadow),
			inset 0 -1px 0 var(--face-highlight);
	}

	.zone-silk,
	.disc-mark {
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--text-label);
	}

	.center-zone {
		display: flex;
		align-items: stretch;
		padding-block: var(--space-2xs);
	}

	.tray-bezel {
		position: relative;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		padding: var(--space-xs) var(--space-lg);
		border: 1px solid var(--chassis-edge);
		border-top-color: var(--face-highlight);
		border-bottom-color: var(--face-shadow);
		box-shadow:
			inset 0 0 0 2px var(--chassis-groove),
			inset 0 1px 0 3px var(--chassis-panel-hi),
			inset 0 1px 0 var(--face-highlight),
			inset 0 -1px 0 var(--face-shadow);
	}

	.tray-window {
		position: relative;
		min-width: 0;
		min-height: 0;
		flex: 1;
		overflow: hidden;
	}

	/* Fit the existing display stack into the 430/125 band without rewriting the panel. */
	.tray-window :global(.display) {
		width: 100%;
		height: 100%;
		padding: var(--space-xs) var(--space-sm);
		--type-hero: clamp(1.35rem, 2.4vw, 2rem);
		--segment-height: 10px;
	}

	.tray-window :global(.display-glyphs) {
		gap: var(--space-2xs);
	}

	.disc-mark {
		position: absolute;
		left: 50%;
		bottom: 3px;
		transform: translateX(-50%);
		font-size: 0.48rem;
		letter-spacing: 0.08em;
		white-space: nowrap;
	}

	.bezel-screw {
		position: absolute;
		top: 50%;
		width: 8px;
		height: 8px;
		box-sizing: border-box;
		border-radius: 50%;
		border: 0;
		background: var(--btn-recess);
		box-shadow:
			inset 0 1px 1px var(--face-shadow),
			inset 0 -1px 0 var(--face-highlight);
		transform: translateY(-50%);
	}

	.bezel-screw::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 15%;
		width: 70%;
		height: 1px;
		background: var(--face-highlight);
		transform: translateY(-50%) rotate(-22deg);
	}

	.bezel-screw--left {
		left: 6px;
	}

	.bezel-screw--right {
		right: 6px;
	}

	.right-zone {
		padding: var(--space-xs) 0 var(--space-xs) var(--space-sm);
	}

	.right-zone :global(.transport) {
		height: 100%;
	}

	.rail {
		display: flex;
		align-items: baseline;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	.rail--bottom {
		border-top: 1px solid var(--chassis-groove);
		padding-top: var(--space-2xs);
	}

	.model-mark {
		font-family: var(--font-silk);
		font-size: 0.44rem;
		line-height: 1;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--text-label);
	}

	.model-highlight {
		font-size: 0.72rem;
		color: var(--text-secondary);
	}

	.track-panel {
		width: 100%;
		box-sizing: border-box;
		padding: var(--space-md);
		background: var(--chassis-panel);
		border: 1px solid var(--chassis-edge);
		border-radius: var(--radius);
		box-shadow:
			inset 0 1px 0 var(--chassis-panel-hi),
			inset 0 -1px 0 var(--chassis-groove);
	}

	@media (max-width: 900px) {
		.machine {
			aspect-ratio: auto;
			overflow: visible;
		}

		.faceplate-grid {
			grid-template-columns: minmax(0, 1fr);
			row-gap: var(--space-lg);
		}

		.left-zone,
		.right-zone {
			padding: var(--space-sm) 0;
		}

		.left-zone {
			min-height: 220px;
		}

		.left-controls {
			row-gap: var(--space-md);
		}

		.center-zone {
			min-height: 260px;
		}

		.right-zone :global(.transport) {
			min-height: 230px;
		}
	}

	@media (max-width: 720px) {
		.machine {
			padding: var(--space-md) var(--space-md) var(--space-sm);
			gap: var(--space-md);
		}

		.header-band {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.brand-series {
			align-items: end;
			text-align: right;
		}

		.header-cell--right {
			display: none;
		}

		.left-service-row {
			flex-wrap: wrap;
			row-gap: var(--space-sm);
		}
	}

	@media (max-width: 420px) {
		.stage {
			padding: 0;
		}

		.machine {
			border: 0;
			border-radius: 0;
		}

		.track-panel {
			border-inline: 0;
			border-radius: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.left-service-row,
		.center-zone,
		.right-zone {
			transition-duration: 120ms;
		}
	}

	@media (prefers-contrast: more) {
		.machine {
			background: var(--chassis-panel);
			box-shadow: 0 30px 70px -30px oklch(0% 0 0 / 0.9);
		}

		.machine::before,
		.machine::after {
			display: none;
		}

		.header-band {
			border-bottom-color: var(--chassis-edge);
			box-shadow: none;
		}

		.tray-bezel {
			border-color: var(--chassis-edge);
			box-shadow: inset 0 0 0 2px var(--chassis-groove);
		}

		.bezel-screw,
		.phones-jack {
			box-shadow: none;
		}

		.bezel-screw::before {
			display: none;
		}
	}
</style>
