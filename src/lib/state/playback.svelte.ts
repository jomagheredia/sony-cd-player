/* Playback state machine — transitions are driven by the audio engine. */
import { toStreamUrl } from '$lib/api/client';
import { engine } from '$lib/audio/engine';
import { meter } from '$lib/audio/meter.svelte';
import { queue } from './queue.svelte';

export type PlaybackState =
	| { status: 'empty' }
	| { status: 'loading'; trackIndex: number }
	| { status: 'ready'; trackIndex: number }
	| { status: 'playing'; trackIndex: number }
	| { status: 'paused'; trackIndex: number }
	| { status: 'error'; trackIndex: number; reason: string };

const ERROR_ADVANCE_MS = 1600; // 3 blinks at ~500ms each, then auto-advance
const PREV_RESTART_SECONDS = 3;

let current = $state<PlaybackState>({ status: 'empty' });
let currentTime = $state(0);
let duration = $state(0);
let pendingTimer: ReturnType<typeof setTimeout> | undefined;
let pendingAutoplay = false;
let wired = false;

function clearPending() {
	clearTimeout(pendingTimer);
	pendingTimer = undefined;
}

function ensureWired() {
	if (wired || typeof window === 'undefined') return;
	wired = true;
	engine.connect({
		onCanPlay() {
			if (current.status !== 'loading') return;
			if (pendingAutoplay) {
				void engine.play();
			} else {
				meter.reset();
				current = { status: 'ready', trackIndex: current.trackIndex };
			}
		},
		onPlaying() {
			if (!('trackIndex' in current)) return;
			current = { status: 'playing', trackIndex: current.trackIndex };
			meter.start();
		},
		onPaused() {
			if (current.status !== 'playing') return;
			current = { status: 'paused', trackIndex: current.trackIndex };
			meter.freeze();
		},
		onEnded() {
			if (!('trackIndex' in current)) return;
			handleEnded(current.trackIndex);
		},
		onError(reason) {
			fail(reason);
		},
		onTimeUpdate(time, total) {
			currentTime = time;
			if (total > 0) duration = total;
		}
	});
}

function handleEnded(trackIndex: number) {
	if (queue.repeat === 'track') {
		engine.seek(0);
		void engine.play();
		return;
	}
	const nextIndex = findPlayable(trackIndex, 1);
	if (nextIndex == null || (nextIndex === trackIndex && queue.repeat !== 'all')) {
		engine.stop();
		meter.reset();
		currentTime = 0;
		current = { status: 'ready', trackIndex };
		return;
	}
	load(nextIndex, true);
}

function findPlayable(from: number, direction: 1 | -1): number | null {
	const len = queue.tracks.length;
	if (len === 0) return null;

	const playable = queue.tracks.map((t, i) => (t.streamUrl ? i : -1)).filter((i) => i >= 0);
	if (playable.length === 0) return null;

	if (queue.shuffle && playable.length > 1) {
		const others = playable.filter((i) => i !== from);
		const pool = others.length > 0 ? others : playable;
		return pool[Math.floor(Math.random() * pool.length)] ?? null;
	}

	for (let step = 1; step <= len; step++) {
		const idx = (from + direction * step + len * step) % len;
		if (queue.tracks[idx]?.streamUrl) return idx;
	}
	return null;
}

function load(trackIndex: number, autoplay = true) {
	ensureWired();
	clearPending();
	const track = queue.tracks[trackIndex];
	if (!track) {
		meter.reset();
		current = { status: 'empty' };
		currentTime = 0;
		duration = 0;
		return;
	}
	if (!track.streamUrl) {
		meter.reset();
		current = { status: 'error', trackIndex, reason: 'NO STREAM' };
		engine.stop();
		currentTime = 0;
		pendingTimer = setTimeout(() => {
			const target = findPlayable(trackIndex, 1);
			if (target == null) {
				current = { status: 'empty' };
				return;
			}
			load(target, true);
		}, ERROR_ADVANCE_MS);
		return;
	}

	pendingAutoplay = autoplay;
	meter.reset();
	current = { status: 'loading', trackIndex };
	currentTime = 0;
	duration = track.duration ?? 0;
	engine.setVolume(queue.volume);
	engine.load(toStreamUrl(track.streamUrl));
}

function toggle() {
	ensureWired();
	if (current.status === 'playing') {
		engine.pause();
	} else if (current.status === 'paused' || current.status === 'ready') {
		engine.setVolume(queue.volume);
		void engine.play();
	} else if (current.status === 'empty' && queue.tracks.length > 0) {
		const first = queue.tracks.findIndex((t) => Boolean(t.streamUrl));
		load(first >= 0 ? first : 0);
	} else if (current.status === 'error') {
		load(current.trackIndex);
	}
}

function stop() {
	ensureWired();
	clearPending();
	if (!('trackIndex' in current)) return;
	pendingAutoplay = false;
	engine.stop();
	meter.reset();
	currentTime = 0;
	current = { status: 'ready', trackIndex: current.trackIndex };
}

function next() {
	if (queue.tracks.length === 0) return;
	const keepPlaying = current.status === 'playing' || current.status === 'loading';
	const from = 'trackIndex' in current ? current.trackIndex : -1;
	const target = findPlayable(from, 1);
	if (target == null) return;
	load(target, keepPlaying);
}

function previous() {
	ensureWired();
	if (queue.tracks.length === 0) return;

	/* Spec: seek to 0 if past 3s on the current track; otherwise go to previous. */
	if (
		'trackIndex' in current &&
		(current.status === 'playing' || current.status === 'paused' || current.status === 'ready') &&
		engine.getCurrentTime() > PREV_RESTART_SECONDS
	) {
		engine.seek(0);
		currentTime = 0;
		return;
	}

	const keepPlaying = current.status === 'playing' || current.status === 'loading';
	const from = 'trackIndex' in current ? current.trackIndex : 0;
	const target = findPlayable(from, -1);
	if (target == null) return;
	load(target, keepPlaying);
}

function seek(ratio: number) {
	ensureWired();
	if (current.status !== 'playing' && current.status !== 'paused' && current.status !== 'ready') {
		return;
	}
	const total = duration > 0 ? duration : engine.getDuration();
	if (total <= 0) return;
	engine.seek(ratio * total);
	currentTime = engine.getCurrentTime();
}

function seekBy(deltaSeconds: number) {
	ensureWired();
	if (current.status !== 'playing' && current.status !== 'paused' && current.status !== 'ready') {
		return;
	}
	const total = duration > 0 ? duration : engine.getDuration();
	if (total <= 0) return;
	const next = Math.min(total, Math.max(0, engine.getCurrentTime() + deltaSeconds));
	engine.seek(next);
	currentTime = engine.getCurrentTime();
}

function fail(reason: string) {
	clearPending();
	const trackIndex = 'trackIndex' in current ? current.trackIndex : 0;
	pendingAutoplay = false;
	engine.stop();
	meter.reset();
	currentTime = 0;
	current = { status: 'error', trackIndex, reason };
	pendingTimer = setTimeout(() => {
		const target = findPlayable(trackIndex, 1);
		if (target == null) {
			current = { status: 'empty' };
			return;
		}
		load(target, true);
	}, ERROR_ADVANCE_MS);
}

export const playback = {
	get current() {
		return current;
	},
	get currentTime() {
		return currentTime;
	},
	get duration() {
		return duration;
	},
	load,
	toggle,
	stop,
	next,
	previous,
	seek,
	seekBy,
	fail
};
