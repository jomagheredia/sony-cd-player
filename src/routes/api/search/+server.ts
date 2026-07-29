import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchArchiveHits } from '$lib/api/archive';

/* Fast path: advancedsearch only. Client resolves stream URLs in batches via /api/resolve
   so the first results appear without waiting on N metadata round-trips. */

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim();
	if (!q) error(400, 'Missing q');

	const rowsRaw = Number(url.searchParams.get('rows') ?? 8);
	const rows = Number.isFinite(rowsRaw) ? Math.min(15, Math.max(1, Math.floor(rowsRaw))) : 8;

	try {
		const hits = await searchArchiveHits(q, rows);
		return json(hits, {
			headers: {
				'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
			}
		});
	} catch {
		error(502, 'Archive search failed');
	}
};
