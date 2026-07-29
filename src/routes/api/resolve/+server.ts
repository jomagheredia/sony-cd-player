import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveArchiveIds } from '$lib/api/archive';

/* Batch archive.org metadata → normalized Track[]. Skips dead ids silently. */

export const GET: RequestHandler = async ({ url }) => {
	const raw = url.searchParams.get('ids');
	if (!raw?.trim()) error(400, 'Missing ids');

	const ids = raw
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);

	if (ids.length === 0) error(400, 'Missing ids');
	if (ids.length > 40) error(400, 'Too many ids');

	const tracks = await resolveArchiveIds(ids);

	return json(tracks, {
		headers: {
			'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
