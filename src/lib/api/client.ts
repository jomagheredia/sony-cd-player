/* Proxy-aware fetch helpers. Deployed/dev use /api/*; artifact sets VITE_USE_PROXY=false. */
import { DEFAULT_IDS, resolveArchiveIds } from './archive';
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

export { DEFAULT_IDS };

export async function resolveTracks(ids: string[]): Promise<Track[]> {
	if (ids.length === 0) return [];
	if (useProxy()) {
		const res = await fetch(`/api/resolve?ids=${ids.map(encodeURIComponent).join(',')}`);
		if (!res.ok) throw new Error(`resolve failed (${res.status})`);
		return (await res.json()) as Track[];
	}
	return resolveArchiveIds(ids);
}

export async function searchTracks(query: string): Promise<Track[]> {
	const q = query.trim();
	if (!q) return [];

	if (useProxy()) {
		const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
		if (!res.ok) throw new Error(`search failed (${res.status})`);
		return (await res.json()) as Track[];
	}

	/* Artifact mode: hit advancedsearch from the browser, then resolve metadata. */
	const searchUrl = new URL('https://archive.org/advancedsearch.php');
	searchUrl.searchParams.set('q', `${q} AND format:MP3 AND mediatype:audio`);
	searchUrl.searchParams.append('fl[]', 'identifier');
	searchUrl.searchParams.append('fl[]', 'title');
	searchUrl.searchParams.append('fl[]', 'creator');
	searchUrl.searchParams.set('output', 'json');
	searchUrl.searchParams.set('rows', '15');
	searchUrl.searchParams.set('page', '1');

	const res = await fetch(searchUrl.toString());
	if (!res.ok) throw new Error(`search failed (${res.status})`);
	const data = (await res.json()) as {
		response?: { docs?: { identifier?: string }[] };
	};
	const ids = [
		...new Set(
			(data.response?.docs ?? []).map((d) => d.identifier).filter((id): id is string => Boolean(id))
		)
	];
	return resolveArchiveIds(ids);
}
