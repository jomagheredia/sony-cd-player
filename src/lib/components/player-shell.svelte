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
					<PowerKey />

					<div class="left-service-row">
						<div class="phones">
							<span class="phones-jack" aria-hidden="true"></span>
							<span class="zone-silk">Phones</span>
						</div>
						<LevelControl />
					</div>

					<AmsControls />
				</section>

				<section class="faceplate-zone center-zone" aria-label="Disc display">
					<div class="tray-bezel">
						<span class="bezel-screw bezel-screw--left" aria-hidden="true"></span>
						<div class="tray-window">
							<DisplayPanel />
						</div>
						<span class="disc-mark">Compact Disc Digital Audio</span>
						<span class="bezel-screw bezel-screw--right" aria-hidden="true"></span>
					</div>
				</section>

				<section class="faceplate-zone right-zone" aria-label="Program and transport controls">
					<TransportControls />
				</section>
			</div>

			<footer class="rail rail--bottom">
				<span class="rail-silk">
					Current Pulse D/A Converter · 2Hz–20kHz ±0.3dB · 119dB S/N · 0.0015% THD
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
		aspect-ratio: 430 / 125;
		overflow: hidden;
		min-height: 0;
		box-sizing: border-box;
		font-family: var(--font-silk);
		background: var(--chassis-panel);
		border: 1px solid var(--chassis-edge);
		border-radius: var(--radius);
		padding: var(--space-sm) var(--space-md) var(--space-xs);
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: var(--space-xs);
		/* Top bevel catches light, and the unit sits on a surface rather than floating. */
		box-shadow:
			inset 0 1px 0 var(--chassis-panel-hi),
			inset 0 -1px 0 var(--chassis-groove),
			0 30px 70px -30px oklch(0% 0 0 / 0.9);
	}

	/* Anodized grain — a material, not a decorative wash. Barely perceptible by design. */
	.machine::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		background: repeating-linear-gradient(
			to bottom,
			oklch(100% 0 0 / 0.012) 0px,
			oklch(100% 0 0 / 0.012) 1px,
			transparent 1px,
			transparent 3px
		);
	}

	.header-band,
	.faceplate-grid {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 4fr) minmax(0, 3fr);
		column-gap: var(--space-sm);
	}

	.faceplate-grid {
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

	.digital-label,
	.rail-silk {
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
	.left-zone :global(.ams-controls),
	.center-zone,
	.right-zone {
		transition: opacity 420ms var(--ease-out-quart);
	}

	/* Powered down, the controls recede; POWER stays at full contrast as the only live control. */
	.machine[data-phase='standby'] .left-service-row,
	.machine[data-phase='standby'] .left-zone :global(.ams-controls),
	.machine[data-phase='standby'] .center-zone,
	.machine[data-phase='standby'] .right-zone {
		opacity: 0.5;
	}

	.faceplate-zone {
		min-width: 0;
		min-height: 0;
	}

	.left-zone {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm) var(--space-xs) 0;
	}

	.left-service-row {
		display: grid;
		grid-template-columns: minmax(84px, auto) minmax(0, 1fr);
		align-items: end;
		gap: var(--space-md);
	}

	.phones {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.phones-jack {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		box-sizing: border-box;
		border: 3px solid var(--gold-dim);
		border-radius: 50%;
		background: var(--chassis-groove);
		box-shadow: 0 0 0 1px var(--chassis-edge);
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
		min-width: 0;
		min-height: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-2xs);
		padding: var(--space-xs) var(--space-lg) var(--space-2xs);
		border: 1px solid var(--chassis-edge);
		box-shadow:
			inset 0 0 0 2px var(--chassis-groove),
			inset 0 1px 0 3px var(--chassis-panel-hi);
	}

	.tray-window {
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
		align-self: center;
		font-size: 0.48rem;
		letter-spacing: 0.08em;
		white-space: nowrap;
	}

	.bezel-screw {
		position: absolute;
		top: 50%;
		width: 6px;
		height: 6px;
		box-sizing: border-box;
		border-radius: 50%;
		border: 1px solid var(--chassis-edge);
		background: var(--chassis-groove);
		transform: translateY(-50%);
	}

	.bezel-screw--left {
		left: 6px;
	}

	.bezel-screw--right {
		right: 6px;
	}

	.right-zone {
		padding: var(--space-2xs) 0 var(--space-xs) var(--space-sm);
	}

	.right-zone :global(.transport) {
		height: 100%;
	}

	.rail {
		display: flex;
		align-items: baseline;
	}

	.rail--bottom {
		border-top: 1px solid var(--chassis-groove);
		padding-top: var(--space-2xs);
	}

	.rail--bottom .rail-silk {
		font-size: 0.48rem;
		letter-spacing: 0.1em;
		white-space: nowrap;
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
			grid-template-columns: minmax(84px, 0.7fr) minmax(0, 1fr);
		}

		.rail--bottom .rail-silk {
			white-space: normal;
			line-height: 1.5;
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
		.left-zone :global(.ams-controls),
		.center-zone,
		.right-zone {
			transition-duration: 120ms;
		}
	}
</style>
