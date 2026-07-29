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

export async function fetchArchiveMetadata(id: string): Promise<ArchiveMetadata | null> {
	try {
		const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, {
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) return null;
		return (await res.json()) as ArchiveMetadata;
	} catch {
		return null;
	}
}

/** Resolve many identifiers in parallel; skip failures silently. */
export async function resolveArchiveIds(ids: string[]): Promise<Track[]> {
	const settled = await Promise.all(
		ids.map(async (id) => {
			const meta = await fetchArchiveMetadata(id);
			if (!meta) return null;
			return metadataToTrack(id, meta);
		})
	);
	return settled.filter((t): t is Track => t != null);
}
