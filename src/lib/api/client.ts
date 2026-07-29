/* Proxy-aware fetch helpers. Deployed/dev use /api/*; artifact sets VITE_USE_PROXY=false. */
import {
	DEFAULT_IDS,
	chunkIds,
	resolveArchiveIds,
	searchArchiveHits,
	type SearchHit
} from './archive';
import type { Track } from './types';

export function useProxy(): boolean {
	/* Default on — only the artifact build opts out. */
	return import.meta.env.VITE_USE_PROXY !== 'false';
}

/** Route an archive.org (or other) media URL through /api/stream when proxying. */
export function toStreamUrl(url: string): string {
	if (!url) return url;
	if (!useProxy()) return url;
	if (url.startsWith('/api/stream')) return url;
	return `/api/stream?url=${encodeURIComponent(url)}`;
}

export { DEFAULT_IDS, chunkIds };
export type { SearchHit };

export async function resolveTracks(ids: string[]): Promise<Track[]> {
	if (ids.length === 0) return [];
	if (useProxy()) {
		const res = await fetch(`/api/resolve?ids=${ids.map(encodeURIComponent).join(',')}`);
		if (!res.ok) throw new Error(`resolve failed (${res.status})`);
		return (await res.json()) as Track[];
	}
	return resolveArchiveIds(ids, { concurrency: 4, timeoutMs: 3500 });
}

/** Fast advancedsearch hits (no stream URLs yet). */
export async function searchHits(query: string, rows = 8): Promise<SearchHit[]> {
	const q = query.trim();
	if (!q) return [];

	if (useProxy()) {
		const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&rows=${rows}`);
		if (!res.ok) throw new Error(`search failed (${res.status})`);
		return (await res.json()) as SearchHit[];
	}
	return searchArchiveHits(q, rows);
}

/**
 * Progressive search: get hits quickly, then resolve stream URLs in batches.
 * `onBatch` fires after each resolve chunk so the UI can append early.
 */
export async function searchTracksProgressive(
	query: string,
	onBatch: (tracks: Track[]) => void,
	options: { rows?: number; batchSize?: number } = {}
): Promise<number> {
	const hits = await searchHits(query, options.rows ?? 8);
	if (hits.length === 0) return 0;

	const batchSize = options.batchSize ?? 3;
	let total = 0;
	for (const chunk of chunkIds(hits, batchSize)) {
		const tracks = await resolveTracks(chunk.map((h) => h.id));
		if (tracks.length > 0) {
			total += tracks.length;
			onBatch(tracks);
		}
	}
	return total;
}
