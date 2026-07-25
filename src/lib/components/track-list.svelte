<script lang="ts">
	import SearchBar from './search-bar.svelte';
	import { playback } from '$lib/state/playback.svelte';
	import { queue } from '$lib/state/queue.svelte';
	import { formatTime } from '$lib/format-time';

	const activeIndex = $derived('trackIndex' in playback.current ? playback.current.trackIndex : -1);
</script>

<div class="panel">
	<div class="panel-header">TRACK LIST</div>

	<ul class="track-rows">
		{#each queue.tracks as track, i (track.id)}
			<li>
				<button
					type="button"
					class="track-row"
					class:active={i === activeIndex}
					onclick={() => playback.load(i)}
				>
					<span class="track-index">{String(i + 1).padStart(2, '0')}</span>
					<span class="track-meta">{track.title} — {track.artist}</span>
					<span class="track-duration">{formatTime(track.duration)}</span>
				</button>
			</li>
		{/each}
	</ul>

	<SearchBar />
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: calc(var(--space) * 3);
		background: var(--chassis-panel);
		border: 1px solid var(--chassis-edge);
		border-radius: var(--radius);
		padding: calc(var(--space) * 4);
	}

	.panel-header {
		font-family: 'Share Tech Mono', monospace;
		color: var(--text-secondary);
		font-size: 0.7rem;
		letter-spacing: 0.15em;
	}

	.track-rows {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 280px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.track-rows::-webkit-scrollbar {
		width: 2px;
	}

	.track-rows::-webkit-scrollbar-thumb {
		background: var(--display-amber);
	}

	.track-row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: calc(var(--space) * 2);
		padding: calc(var(--space) * 2) 0 calc(var(--space) * 2) calc(var(--space) * 2);
		border: 0;
		border-left: 2px solid transparent;
		border-radius: 0;
		background: none;
		text-align: left;
		cursor: pointer;
		color: var(--text-secondary);
		font-family: system-ui, sans-serif;
		font-size: 0.8rem;
	}

	.track-row.active {
		border-left-color: var(--display-amber);
		color: var(--display-amber);
	}

	.track-row:hover {
		background: var(--btn-surface);
	}

	.track-row:focus-visible {
		outline: 2px solid var(--btn-active);
		outline-offset: -2px;
	}

	.track-index {
		font-family: 'Share Tech Mono', monospace;
		width: 2ch;
		flex-shrink: 0;
	}

	.track-meta {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.track-duration {
		font-family: 'Share Tech Mono', monospace;
		color: var(--text-label);
		font-size: 0.75rem;
		flex-shrink: 0;
	}
</style>
