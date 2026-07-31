<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/tokens.css';
	import '@fontsource/dseg7-classic/latin-400.css';
	import { DEFAULT_IDS, resolveTracks } from '$lib/api/client';
	import { engine } from '$lib/audio/engine';
	import { playback } from '$lib/state/playback.svelte';
	import { power } from '$lib/state/power.svelte';
	import { queue } from '$lib/state/queue.svelte';
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
	<div class="machine" data-phase={phase}>
		<div class="rail rail--top">
			<span class="brand-sony">Sony</span>
			<span class="brand-series">
				<span class="series-name">XA7ES</span>
				<span class="series-sub">Current Pulse D/A Convert System</span>
			</span>
			<span class="rail-silk rail-silk--end">Digital Out</span>
		</div>

		<div class="deck">
			<DisplayPanel />
			<TrackList />
		</div>

		<div class="control-band">
			<PowerKey />
			<LevelControl />
			<TransportControls />
		</div>

		<div class="rail rail--bottom">
			<span class="rail-silk">Compact Disc Digital Audio</span>
			<span class="rail-silk rail-silk--end">Compact Disc Player &nbsp;CDP-XA7ES</span>
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

	.machine {
		position: relative;
		isolation: isolate;
		width: 100%;
		max-width: 1200px;
		box-sizing: border-box;
		font-family: var(--font-silk);
		background: var(--chassis-panel);
		border: 1px solid var(--chassis-edge);
		border-radius: var(--radius);
		padding: var(--space-lg) var(--space-xl) var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
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

	.rail {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.rail--top {
		align-items: start;
	}

	.brand-sony {
		font-family: var(--font-silk);
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--text-secondary);
		flex: 1;
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

	.rail-silk {
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--text-label);
	}

	.rail--top .rail-silk--end {
		flex: 1;
		text-align: right;
	}

	.deck {
		display: grid;
		/* minmax(0, ...) is what keeps a 100-character archive.org title from
		   stealing width from the display cavity. */
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: var(--space-lg);
		align-items: start;
		transition: opacity 420ms var(--ease-out-quart);
	}

	/* Powered down, the deck recedes; POWER stays at full contrast as the only live control. */
	.machine[data-phase='standby'] .deck {
		opacity: 0.5;
	}

	.control-band {
		display: flex;
		align-items: center;
		gap: var(--space-xl);
		padding-top: var(--space-xs);
		border-top: 1px solid var(--chassis-groove);
	}

	.control-band :global(.transport) {
		flex: 1;
	}

	.rail--bottom {
		border-top: 1px solid var(--chassis-groove);
		padding-top: var(--space-xs);
	}

	@media (max-width: 900px) {
		.deck {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 720px) {
		.machine {
			padding: var(--space-md) var(--space-md) var(--space-sm);
			gap: var(--space-md);
		}

		.control-band {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
		}

		.brand-series {
			align-items: end;
		}

		.rail--top .rail-silk--end {
			display: none;
		}
	}

	@media (max-width: 420px) {
		.stage {
			padding: 0;
		}

		.machine {
			border: 0;
			border-radius: 0;
			min-height: 100dvh;
		}

		.rail--bottom .rail-silk--end {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.deck {
			transition-duration: 120ms;
		}
	}
</style>
