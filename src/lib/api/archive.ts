/* Shared Internet Archive helpers — used by /api/* routes and artifact-mode client fetches. */
import type { Track } from './types';

/** Known-good default identifiers (skip silently if any 404). */
export const DEFAULT_IDS = [
	'nocturneineflatmajorop.9no.2',
	'Ast0r-SoWhat',
	'BlueRondoAlLaTurk-4GuitarArrangementrenderedMidi',
	'beethoven-symphony-no-5',
	'LudwigVanBeethovenMoonlightSonataAdagioSostenutogetTune.net'
] as const;

type ArchiveFile = {
	name?: string;
	format?: string;
	length?: string | number;
};

type ArchiveMetadata = {
	metadata?: {
		identifier?: string;
		title?: string | string[];
		creator?: string | string[];
	};
	files?: ArchiveFile[];
};

function asSingle(value: string | string[] | undefined): string {
	if (Array.isArray(value)) return value[0] ?? '';
	return value ?? '';
}

export function parseLength(raw: string | number | undefined): number | undefined {
	if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return raw;
	if (typeof raw !== 'string') return undefined;
	const trimmed = raw.trim();
	if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
	const parts = trimmed.split(':').map((p) => Number(p));
	if (parts.some((n) => !Number.isFinite(n))) return undefined;
	if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
	if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
	return undefined;
}

function formatRank(format: string | undefined): number {
	if (format === 'VBR MP3') return 0;
	if (format === '128Kbps MP3') return 1;
	return 2;
}

/** Prefer VBR MP3, then 128Kbps MP3, then any .mp3 — stable name sort within a tier. */
export function pickBestMp3(files: ArchiveFile[]): ArchiveFile | null {
	const cands = files.filter((f) => {
		const name = f.name ?? '';
		const low = name.toLowerCase();
		if (!name || low.endsWith('.m3u') || low.includes('_files.xml')) return false;
		const fmt = f.format ?? '';
		return fmt === 'VBR MP3' || fmt === '128Kbps MP3' || low.endsWith('.mp3');
	});
	if (cands.length === 0) return null;
	cands.sort((a, b) => {
		const byFmt = formatRank(a.format) - formatRank(b.format);
		if (byFmt !== 0) return byFmt;
		return (a.name ?? '').localeCompare(b.name ?? '', undefined, { numeric: true });
	});
	return cands[0] ?? null;
}

export function archiveDownloadUrl(identifier: string, filename: string): string {
	const encodedName = filename
		.split('/')
		.map((part) => encodeURIComponent(part))
		.join('/');
	return `https://archive.org/download/${identifier}/${encodedName}`;
}

export function metadataToTrack(id: string, data: ArchiveMetadata): Track | null {
	const file = pickBestMp3(data.files ?? []);
	if (!file?.name) return null;
	const identifier = data.metadata?.identifier ?? id;
	return {
		id: identifier,
		title: asSingle(data.metadata?.title) || identifier,
		artist: asSingle(data.metadata?.creator) || 'Unknown',
		streamUrl: archiveDownloadUrl(identifier, file.name),
		duration: parseLength(file.length),
		source: 'archive'
	};
}

export async function fetchArchiveMetadata(
	id: string,
	timeoutMs = 3500
): Promise<ArchiveMetadata | null> {
	try {
		const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
			headers: { Accept: 'application/json' },
			signal: AbortSignal.timeout(timeoutMs)
		});
		if (!res.ok) return null;
		return (await res.json()) as ArchiveMetadata;
	} catch {
		return null;
	}
}

export type ResolveOptions = {
	/** Max in-flight metadata requests (archive.org throttles wide fan-out). */
	concurrency?: number;
	/** Per-item fetch timeout in ms. */
	timeoutMs?: number;
};

/** Resolve many identifiers with bounded concurrency; skip failures / timeouts silently. */
export async function resolveArchiveIds(
	ids: string[],
	options: ResolveOptions = {}
): Promise<Track[]> {
	const concurrency = Math.max(1, options.concurrency ?? 4);
	const timeoutMs = options.timeoutMs ?? 3500;
	const tracks: Track[] = [];
	let cursor = 0;

	async function worker() {
		while (cursor < ids.length) {
			const id = ids[cursor++]!;
			const meta = await fetchArchiveMetadata(id, timeoutMs);
			if (!meta) continue;
			const track = metadataToTrack(id, meta);
			if (track) tracks.push(track);
		}
	}

	const workers = Array.from({ length: Math.min(concurrency, ids.length) }, () => worker());
	await Promise.all(workers);
	/* Preserve input order for stable UI */
	const byId = new Map(tracks.map((t) => [t.id, t]));
	return ids.map((id) => byId.get(id)).filter((t): t is Track => t != null);
}

export type SearchHit = {
	id: string;
	title: string;
	artist: string;
};

type SearchDoc = {
	identifier?: string;
	title?: string | string[];
	creator?: string | string[];
};

/** Fast advancedsearch only — no per-item metadata. Caller resolves stream URLs separately. */
export async function searchArchiveHits(
	query: string,
	rows = 8,
	timeoutMs = 8000
): Promise<SearchHit[]> {
	const q = query.trim();
	if (!q) return [];

	const searchUrl = new URL('https://archive.org/advancedsearch.php');
	searchUrl.searchParams.set('q', `${q} AND format:MP3 AND mediatype:audio`);
	searchUrl.searchParams.append('fl[]', 'identifier');
	searchUrl.searchParams.append('fl[]', 'title');
	searchUrl.searchParams.append('fl[]', 'creator');
	searchUrl.searchParams.set('output', 'json');
	searchUrl.searchParams.set('rows', String(rows));
	searchUrl.searchParams.set('page', '1');

	const res = await fetch(searchUrl.toString(), {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(timeoutMs)
	});
	if (!res.ok) throw new Error(`search failed (${res.status})`);

	const data = (await res.json()) as { response?: { docs?: SearchDoc[] } };
	const docs = data.response?.docs ?? [];
	const seen = new Set<string>();
	const hits: SearchHit[] = [];

	for (const doc of docs) {
		const id = doc.identifier;
		if (!id || seen.has(id)) continue;
		seen.add(id);
		hits.push({
			id,
			title: asSingle(doc.title) || id,
			artist: asSingle(doc.creator) || 'Unknown'
		});
	}
	return hits;
}

/** Split an array into chunks of `size` (last chunk may be smaller). */
export function chunkIds<T>(items: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
	return out;
}
