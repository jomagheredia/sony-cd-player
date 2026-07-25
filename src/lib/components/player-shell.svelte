<script lang="ts">
	import '$lib/styles/tokens.css';
	import DisplayPanel from './display-panel.svelte';
	import TransportControls from './transport-controls.svelte';
	import TrackList from './track-list.svelte';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="chassis">
	<div class="chassis-brand">
		<span class="brand-sony">Sony</span>
		<span class="brand-model">CDP-XA7ES</span>
	</div>

	<div class="chassis-body">
		<div class="chassis-column chassis-column--left">
			<DisplayPanel />
			<TransportControls />
		</div>
		<div class="chassis-column chassis-column--right">
			<TrackList />
		</div>
	</div>

	<div class="chassis-footer">Compact Disc Digital Audio</div>
</div>

<style>
	:global(html),
	:global(body) {
		background: var(--chassis-bg);
		margin: 0;
		color-scheme: dark;
	}

	.chassis {
		font-family: system-ui, sans-serif;
		background: var(--chassis-panel);
		border: 1px solid var(--chassis-edge);
		border-radius: var(--radius);
		max-width: 760px;
		margin: 40px auto;
		padding: calc(var(--space) * 6);
		display: flex;
		flex-direction: column;
		gap: calc(var(--space) * 5);
	}

	.chassis-brand {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.brand-sony {
		color: var(--text-label);
		letter-spacing: 0.3em;
		font-size: 0.75rem;
		font-variant-caps: small-caps;
	}

	.brand-model {
		color: var(--text-label);
		font-family: 'Share Tech Mono', monospace;
		font-size: 0.65rem;
	}

	.chassis-body {
		display: flex;
		gap: calc(var(--space) * 5);
	}

	.chassis-column {
		display: flex;
		flex-direction: column;
		gap: calc(var(--space) * 4);
	}

	.chassis-column--left {
		flex: 1 1 60%;
	}

	.chassis-column--right {
		flex: 1 1 40%;
	}

	.chassis-footer {
		text-align: center;
		font-size: 8px;
		letter-spacing: 0.25em;
		color: var(--text-label);
		font-variant-caps: small-caps;
	}

	@media (max-width: 600px) {
		.chassis-body {
			flex-direction: column;
		}
	}

	@media (max-width: 360px) {
		.chassis {
			padding: calc(var(--space) * 3);
			margin: 0;
			border-radius: 0;
		}
	}
</style>
