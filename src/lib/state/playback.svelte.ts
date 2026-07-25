/* Playback state machine. In phase 2 transitions are driven by the transport controls
   against fake timers — the audio engine becomes the transition source in phase 3. */
import { queue } from './queue.svelte';

export type PlaybackState =
	| { status: 'empty' }
	| { status: 'loading'; trackIndex: number }
	| { status: 'ready'; trackIndex: number }
	| { status: 'playing'; trackIndex: number }
	| { status: 'paused'; trackIndex: number }
	| { status: 'error'; trackIndex: number; reason: string };

const FAKE_LOAD_MS = 600;
const ERROR_ADVANCE_MS = 1600; // 3 blinks at ~500ms each, then auto-advance

let current = $state<PlaybackState>({ status: 'empty' });
let pendingTimer: ReturnType<typeof setTimeout> | undefined;

function clearPending() {
	clearTimeout(pendingTimer);
	pendingTimer = undefined;
}

function load(trackIndex: number, autoplay = true) {
	clearPending();
	current = { status: 'loading', trackIndex };
	pendingTimer = setTimeout(() => {
		current = autoplay ? { status: 'playing', trackIndex } : { status: 'ready', trackIndex };
	}, FAKE_LOAD_MS);
}

function toggle() {
	if (current.status === 'playing') {
		current = { status: 'paused', trackIndex: current.trackIndex };
	} else if (current.status === 'paused' || current.status === 'ready') {
		current = { status: 'playing', trackIndex: current.trackIndex };
	} else if (current.status === 'empty' && queue.tracks.length > 0) {
		load(0);
	}
}

function stop() {
	clearPending();
	if ('trackIndex' in current) {
		current = { status: 'ready', trackIndex: current.trackIndex };
	}
}

function next() {
	if (queue.tracks.length === 0) return;
	const keepPlaying = current.status === 'playing' || current.status === 'loading';
	const from = 'trackIndex' in current ? current.trackIndex : -1;
	load((from + 1) % queue.tracks.length, keepPlaying);
}

function previous() {
	// Spec: previous track, or seek to 0 if past 3s — position doesn't exist until
	// the engine lands in phase 3, so this is always "previous track" for now.
	if (queue.tracks.length === 0) return;
	const keepPlaying = current.status === 'playing' || current.status === 'loading';
	const from = 'trackIndex' in current ? current.trackIndex : 1;
	const len = queue.tracks.length;
	load((from - 1 + len) % len, keepPlaying);
}

function fail(reason: string) {
	clearPending();
	const trackIndex = 'trackIndex' in current ? current.trackIndex : 0;
	current = { status: 'error', trackIndex, reason };
	// DISC ERR blinks 3x, then the machine auto-advances past the bad track
	pendingTimer = setTimeout(next, ERROR_ADVANCE_MS);
}

/* Dev-only: step the display through every state in order, for verifying the panel
   renders each one. Wired to a click on the status badge; remove in phase 3 when
   the audio engine drives transitions for real. */
const DEV_CYCLE = ['empty', 'loading', 'ready', 'playing', 'paused', 'error'] as const;

function devCycle() {
	clearPending();
	const idx = DEV_CYCLE.indexOf(current.status);
	const nextStatus = DEV_CYCLE[(idx + 1) % DEV_CYCLE.length];
	const trackIndex = 'trackIndex' in current ? current.trackIndex : 0;
	switch (nextStatus) {
		case 'empty':
			current = { status: 'empty' };
			break;
		case 'error':
			fail('demo');
			break;
		default:
			current = { status: nextStatus, trackIndex };
	}
}

export const playback = {
	get current() {
		return current;
	},
	load,
	toggle,
	stop,
	next,
	previous,
	fail,
	devCycle
};
