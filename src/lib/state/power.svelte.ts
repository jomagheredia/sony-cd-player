/* Power state — gates the whole faceplate and drives the warm-up ceremony.

   The phases mirror what a real VFD player does on power-up: the chassis energizes,
   the display filament blooms out of black, every segment lights for a self-test,
   then the readout collapses to the actual disc state. Nothing here is decorative —
   the TOC-read beat that follows is the real queue resolve, not a timed fake. */

import { engine } from '$lib/audio/engine';
import { meter } from '$lib/audio/meter.svelte';
import { playback } from './playback.svelte';

export type PowerPhase =
	| 'standby' /* Dark and inert. Only POWER responds. */
	| 'energize' /* Silkscreen lit, cavity blooming, no glyphs yet. */
	| 'self-test' /* Every segment and digit at full scale. */
	| 'on'; /* Normal operation. */

const ENERGIZE_MS = 180;
const SELF_TEST_MS = 700;
const REDUCED_MOTION_MS = 200;
const SESSION_KEY = 'xa7es-power';

let phase = $state<PowerPhase>('standby');
let timers: ReturnType<typeof setTimeout>[] = [];

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clearTimers() {
	for (const id of timers) clearTimeout(id);
	timers = [];
}

function at(delay: number, fn: () => void) {
	timers.push(setTimeout(fn, delay));
}

/** Restore power state on mount. Within a session the ceremony plays once —
    powering the unit off and on again arms it to play in full. */
function restore() {
	if (typeof window === 'undefined') return;
	try {
		if (sessionStorage.getItem(SESSION_KEY) === 'on') phase = 'on';
	} catch {
		/* Private mode or blocked storage — fall back to the full ceremony. */
	}
}

function remember(value: PowerPhase) {
	if (typeof window === 'undefined') return;
	try {
		if (value === 'on') sessionStorage.setItem(SESSION_KEY, 'on');
		else sessionStorage.removeItem(SESSION_KEY);
	} catch {
		/* Non-fatal. */
	}
}

function on() {
	if (phase !== 'standby') return;
	clearTimers();

	/* The POWER press is a user gesture, which is the only moment a browser lets us
	   open the AudioContext. Doing it here is what makes the first play() instant. */
	void engine.unlock();

	if (prefersReducedMotion()) {
		phase = 'energize';
		at(REDUCED_MOTION_MS, () => {
			phase = 'on';
			remember('on');
		});
		return;
	}

	phase = 'energize';
	at(ENERGIZE_MS, () => {
		phase = 'self-test';
	});
	at(ENERGIZE_MS + SELF_TEST_MS, () => {
		phase = 'on';
		remember('on');
	});
}

function off() {
	clearTimers();
	phase = 'standby';
	remember('standby');
	playback.stop();
	meter.reset();
}

function toggle() {
	if (phase === 'standby') on();
	else off();
}

export const power = {
	get phase() {
		return phase;
	},
	/** True once the machine has finished warming up. Controls stay inert until then. */
	get ready() {
		return phase === 'on';
	},
	/** True whenever the cavity should be emitting light. */
	get lit() {
		return phase === 'self-test' || phase === 'on';
	},
	get selfTest() {
		return phase === 'self-test';
	},
	restore,
	on,
	off,
	toggle
};
