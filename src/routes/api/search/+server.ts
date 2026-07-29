import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveArchiveIds } from '$lib/api/archive';

/* Wrap archive.org advanced search, then resolve hits to the same Track[] shape as /api/resolve. */

type SearchDoc = {
	identifier?: string;
};

type SearchResponse = {
	response?: {
		docs?: SearchDoc[];
	};
};

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim();
	if (!q) error(400, 'Missing q');

	const searchUrl = new URL('https://archive.org/advancedsearch.php');
	searchUrl.searchParams.set('q', `${q} AND format:MP3 AND mediatype:audio`);
	searchUrl.searchParams.append('fl[]', 'identifier');
	searchUrl.searchParams.append('fl[]', 'title');
	searchUrl.searchParams.append('fl[]', 'creator');
	searchUrl.searchParams.set('output', 'json');
	searchUrl.searchParams.set('rows', '15');
	searchUrl.searchParams.set('page', '1');

	let docs: SearchDoc[] = [];
	try {
		const res = await fetch(searchUrl.toString(), {
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) error(502, 'Archive search failed');
		const data = (await res.json()) as SearchResponse;
		docs = data.response?.docs ?? [];
	} catch {
		error(502, 'Archive search failed');
	}

	const ids = [...new Set(docs.map((d) => d.identifier).filter((id): id is string => Boolean(id)))];

	if (ids.length === 0) {
		return json([], {
			headers: {
				'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
			}
		});
	}

	const tracks = await resolveArchiveIds(ids);

	return json(tracks, {
		headers: {
			'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
		}
	});
};
