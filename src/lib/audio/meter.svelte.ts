/* Live L/R meter levels — rAF loop samples analysers (or simulated envelope). */
import { engine } from './engine';
import {
	channelDisplay,
	createPeakHold,
	levelsFromAnalyser,
	simulateEnvelope,
	updatePeakHold,
	type PeakHoldState
} from './metering';
import { useProxy } from '$lib/api/client';

let left = $state(0);
let right = $state(0);
let rafId = 0;
let running = false;
let frozen = false;
let reducedMotion = false;
let holdL: PeakHoldState = createPeakHold();
let holdR: PeakHoldState = createPeakHold();
let bufferL: Uint8Array<ArrayBuffer> | null = null;
let bufferR: Uint8Array<ArrayBuffer> | null = null;

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureBuffers(leftA: AnalyserNode, rightA: AnalyserNode) {
	if (!bufferL || bufferL.length !== leftA.fftSize) {
		bufferL = new Uint8Array(leftA.fftSize);
	}
	if (!bufferR || bufferR.length !== rightA.fftSize) {
		bufferR = new Uint8Array(rightA.fftSize);
	}
}

function tick(now: number) {
	if (!running || frozen) return;

	reducedMotion = prefersReducedMotion();
	const pair = engine.getAnalysers();
	const canAnalyse = useProxy() && pair;

	let levelL: number;
	let levelR: number;

	if (canAnalyse) {
		ensureBuffers(pair.left, pair.right);
		levelL = levelsFromAnalyser(pair.left, bufferL!);
		levelR = levelsFromAnalyser(pair.right, bufferR!);
	} else {
		const t = engine.getCurrentTime();
		levelL = simulateEnvelope(t, 'L');
		levelR = simulateEnvelope(t, 'R');
	}

	if (reducedMotion) {
		holdL = { level: levelL, holdUntil: now, lastDecay: now };
		holdR = { level: levelR, holdUntil: now, lastDecay: now };
	} else {
		holdL = updatePeakHold(holdL, levelL, now);
		holdR = updatePeakHold(holdR, levelR, now);
	}

	left = channelDisplay(levelL, holdL, reducedMotion).display;
	right = channelDisplay(levelR, holdR, reducedMotion).display;

	rafId = requestAnimationFrame(tick);
}

function start() {
	if (typeof window === 'undefined') return;
	frozen = false;
	if (running) return;
	running = true;
	reducedMotion = prefersReducedMotion();
	rafId = requestAnimationFrame(tick);
}

function freeze() {
	/* Keep last levels; stop sampling. */
	frozen = true;
	running = false;
	cancelAnimationFrame(rafId);
	rafId = 0;
}

function reset() {
	frozen = false;
	running = false;
	cancelAnimationFrame(rafId);
	rafId = 0;
	holdL = createPeakHold();
	holdR = createPeakHold();
	left = 0;
	right = 0;
}

export const meter = {
	get left() {
		return left;
	},
	get right() {
		return right;
	},
	start,
	freeze,
	reset
};
