import type { Track } from '$lib/api/types';

/* Queue starts empty; player-shell loads DEFAULT_IDS via /api/resolve on mount. */

let tracks = $state<Track[]>([]);
let reading = $state(true);
let shuffle = $state(false);
let repeat = $state<'off' | 'track' | 'all'>('off');
let volume = $state(0.8);

export const queue = {
	get tracks() {
		return tracks;
	},
	set tracks(next: Track[]) {
		tracks = next;
	},
	/** True while the initial resolve is in flight — the TOC read, in machine terms. */
	get reading() {
		return reading;
	},
	set reading(next: boolean) {
		reading = next;
	},
	append(next: Track[]) {
		const unique = next.filter(
			(t) => Boolean(t.streamUrl) && !tracks.some((existing) => existing.id === t.id)
		);
		if (unique.length === 0) return 0;
		tracks = [...tracks, ...unique];
		return unique.length;
	},
	get shuffle() {
		return shuffle;
	},
	toggleShuffle() {
		shuffle = !shuffle;
	},
	get repeat() {
		return repeat;
	},
	cycleRepeat() {
		repeat = repeat === 'off' ? 'track' : repeat === 'track' ? 'all' : 'off';
	},
	get volume() {
		return volume;
	},
	set volume(next: number) {
		volume = Math.min(1, Math.max(0, next));
	},
	adjustVolume(delta: number) {
		volume = Math.min(1, Math.max(0, volume + delta));
		return volume;
	}
};
