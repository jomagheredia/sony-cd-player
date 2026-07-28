/* Proxy-aware fetch helpers. Deployed/dev use /api/*; artifact sets VITE_USE_PROXY=false. */

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
