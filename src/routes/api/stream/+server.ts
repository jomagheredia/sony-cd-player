import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/* CORS-clean audio proxy — required for MediaElementSourceNode / AnalyserNode.
   Forwards Range so seeking keeps working. Never buffers the body. */

const PASS_THROUGH_HEADERS = [
	'content-type',
	'content-length',
	'content-range',
	'accept-ranges',
	'cache-control'
] as const;

function isAllowedHost(hostname: string): boolean {
	const host = hostname.toLowerCase();
	/* archive.org plus CDN edges (dn*.ca.archive.org, ia*.us.archive.org, …) */
	if (host === 'archive.org') return true;
	if (host.endsWith('.archive.org')) return true;
	return false;
}

function parseTarget(raw: string | null): URL {
	if (!raw) error(400, 'Missing url');
	let parsed: URL;
	try {
		parsed = new URL(raw);
	} catch {
		error(400, 'Invalid url');
	}
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		error(400, 'Invalid protocol');
	}
	if (!isAllowedHost(parsed.hostname)) {
		error(403, 'Host not allowlisted');
	}
	return parsed;
}

function corsHeaders(): Headers {
	const headers = new Headers();
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
	headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Range');
	return headers;
}

async function proxy(request: Request, url: URL, method: 'GET' | 'HEAD'): Promise<Response> {
	const target = parseTarget(url.searchParams.get('url'));

	const upstreamHeaders = new Headers();
	const range = request.headers.get('range');
	if (range) upstreamHeaders.set('Range', range);
	upstreamHeaders.set(
		'User-Agent',
		request.headers.get('user-agent') ?? 'CDP-XA7ES/1.0 (+https://github.com/)'
	);
	upstreamHeaders.set('Accept', '*/*');

	const upstream = await fetch(target.toString(), {
		method,
		headers: upstreamHeaders,
		redirect: 'follow'
	});

	const finalHost = new URL(upstream.url).hostname;
	if (!isAllowedHost(finalHost)) {
		error(403, 'Redirect host not allowlisted');
	}

	const headers = corsHeaders();
	for (const name of PASS_THROUGH_HEADERS) {
		const value = upstream.headers.get(name);
		if (value) headers.set(name, value);
	}

	return new Response(method === 'HEAD' ? null : upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers
	});
}

export const GET: RequestHandler = async ({ request, url }) => proxy(request, url, 'GET');

export const HEAD: RequestHandler = async ({ request, url }) => proxy(request, url, 'HEAD');

export const OPTIONS: RequestHandler = async () =>
	new Response(null, {
		status: 204,
		headers: corsHeaders()
	});
