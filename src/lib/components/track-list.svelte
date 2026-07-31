<script lang="ts">
	import SearchBar from './search-bar.svelte';
	import { playback } from '$lib/state/playback.svelte';
	import { power } from '$lib/state/power.svelte';
	import { queue } from '$lib/state/queue.svelte';
	import { formatTime } from '$lib/format-time';

	const activeIndex = $derived('trackIndex' in playback.current ? playback.current.trackIndex : -1);
	const inert = $derived(!power.ready);
	const tracks = $derived(queue.tracks);
</script>

<section class="panel" aria-label="Disc contents">
	<header class="panel-head">
		<span class="panel-title">Track list</span>
		<span class="panel-count" aria-hidden="true">
			{tracks.length > 0 ? `${String(tracks.length).padStart(2, '0')} TR` : '--'}
		</span>
	</header>

	<div class="rows-frame">
		{#if tracks.length > 0}
			<ul class="rows">
				{#each tracks as track, i (track.id)}
					<li>
						<button
							type="button"
							class="row"
							class:active={i === activeIndex}
							aria-current={i === activeIndex ? 'true' : undefined}
							disabled={inert}
							onclick={() => playback.load(i)}
						>
							<span class="row-cue" aria-hidden="true">{i === activeIndex ? '▸' : ''}</span>
							<span class="row-index">{String(i + 1).padStart(2, '0')}</span>
							<span class="row-text">
								<span class="row-name">{track.title}</span>
								{#if track.artist}
									<span class="row-artist">{track.artist}</span>
								{/if}
							</span>
							<span class="row-time">{formatTime(track.duration)}</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="rows-empty">
				<span class="empty-head">{queue.reading ? 'Reading TOC' : 'No disc'}</span>
				<span class="empty-note">
					{queue.reading
						? 'Resolving the default disc from archive.org.'
						: 'Search the archive below to load tracks.'}
				</span>
			</p>
		{/if}
	</div>

	<SearchBar />
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.panel-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
		padding-bottom: var(--space-2xs);
		border-bottom: 1px solid var(--chassis-edge);
	}

	.panel-title {
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		letter-spacing: var(--track-silk);
		text-transform: uppercase;
		color: var(--text-label);
	}

	.panel-count {
		font-family: var(--font-vfd);
		font-size: var(--type-silk);
		letter-spacing: 0.12em;
		color: var(--text-label);
	}

	.rows-frame {
		/* Recessed well, so the list reads as part of the chassis rather than a card. */
		background: var(--chassis-groove);
		box-shadow: inset 0 1px 3px oklch(0% 0 0 / 0.5);
		min-height: 168px;
		max-height: 232px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--gold-dim) transparent;
	}

	.rows-frame::-webkit-scrollbar {
		width: 2px;
	}

	.rows-frame::-webkit-scrollbar-thumb {
		background: var(--gold-dim);
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		width: 100%;
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		border: 0;
		border-radius: 0;
		background: none;
		text-align: left;
		cursor: pointer;
		color: var(--text-secondary);
		font-family: var(--font-silk);
		font-size: var(--type-sm);
		min-width: 0;
	}

	.rows li:nth-child(odd) .row {
		background: oklch(11% 0.004 260 / 0.5);
	}

	.row-cue {
		font-family: var(--font-vfd);
		width: 1ch;
		flex-shrink: 0;
		color: var(--phosphor);
	}

	.row-index {
		font-family: var(--font-vfd);
		width: 2ch;
		flex-shrink: 0;
		color: var(--text-label);
	}

	.row-text {
		flex: 1;
		min-width: 0;
		display: flex;
		gap: var(--space-xs);
		align-items: baseline;
	}

	/* Archive.org titles run past 100 characters, so both parts have to be able to give way. */
	.row-name,
	.row-artist {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-name {
		flex: 0 1 auto;
	}

	.row-artist {
		flex: 0 2 auto;
		color: var(--text-label);
		font-size: var(--type-silk);
	}

	.row-time {
		font-family: var(--font-vfd);
		color: var(--text-label);
		font-size: var(--type-silk);
		flex-shrink: 0;
	}

	.row:hover:not(:disabled) {
		background: var(--btn-surface);
		color: oklch(84% 0.012 260);
	}

	.row.active:not(:disabled) {
		color: var(--phosphor);
		background: oklch(20% 0.014 62);
	}

	.row.active .row-index {
		color: var(--phosphor-mid);
	}

	.row:focus-visible {
		outline: 2px solid var(--phosphor);
		outline-offset: -2px;
	}

	.row:disabled {
		cursor: default;
		color: oklch(42% 0.008 260);
	}

	.row:disabled .row-index,
	.row:disabled .row-artist,
	.row:disabled .row-time {
		color: oklch(34% 0.008 260);
	}

	.rows-empty {
		margin: 0;
		padding: var(--space-lg) var(--space-sm);
		display: flex;
		flex-direction: column;
		gap: var(--space-2xs);
		text-align: center;
	}

	.empty-head {
		font-family: var(--font-vfd);
		font-size: var(--type-sm);
		letter-spacing: var(--track-silk);
		text-transform: uppercase;
		color: var(--text-label);
	}

	.empty-note {
		font-family: var(--font-silk);
		font-size: var(--type-silk);
		line-height: 1.6;
		color: var(--text-label);
		max-width: 34ch;
		margin: 0 auto;
	}
</style>
