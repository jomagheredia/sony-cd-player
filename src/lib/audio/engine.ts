/* Audio engine — HTMLAudioElement + Web Audio graph for AnalyserNode.
   Stream URLs must be CORS-clean (/api/stream) before crossOrigin is set. */

import { sampleTimeDomain } from './metering';
import { useProxy } from '$lib/api/client';

export type EngineCallbacks = {
	onPlaying?: () => void;
	onPaused?: () => void;
	onEnded?: () => void;
	onError?: (reason: string) => void;
	onTimeUpdate?: (currentTime: number, duration: number) => void;
	/** Fires once the newly loaded source can play (metadata + buffer). */
	onCanPlay?: () => void;
};

export type AnalyserPair = {
	left: AnalyserNode;
	right: AnalyserNode;
};

let audio: HTMLAudioElement | null = null;
let callbacks: EngineCallbacks = {};
let intentionalPause = false;
let loadGeneration = 0;

let audioCtx: AudioContext | null = null;
let analyserL: AnalyserNode | null = null;
let analyserR: AnalyserNode | null = null;
let mediaSource: MediaElementAudioSourceNode | null = null;
let gateCheckTimer: ReturnType<typeof setTimeout> | undefined;

function getAudio(): HTMLAudioElement {
	if (typeof window === 'undefined') {
		throw new Error('Audio engine is browser-only');
	}
	if (!audio) {
		audio = new Audio();
		audio.preload = 'auto';

		audio.addEventListener('loadedmetadata', () => {
			callbacks.onTimeUpdate?.(audio!.currentTime, finiteDuration());
		});
		audio.addEventListener('playing', () => {
			intentionalPause = false;
			callbacks.onPlaying?.();
			scheduleCorsGateCheck();
		});
		audio.addEventListener('pause', () => {
			if (intentionalPause || audio!.ended) return;
			callbacks.onPaused?.();
		});
		audio.addEventListener('ended', () => callbacks.onEnded?.());
		audio.addEventListener('timeupdate', () => {
			callbacks.onTimeUpdate?.(audio!.currentTime, finiteDuration());
		});
		audio.addEventListener('error', () => {
			const code = audio!.error?.code;
			const reason =
				code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
					? 'UNSUPPORTED'
					: code === MediaError.MEDIA_ERR_NETWORK
						? 'NETWORK'
						: 'DISC ERR';
			callbacks.onError?.(reason);
		});
	}
	return audio;
}

function finiteDuration(): number {
	const d = audio?.duration ?? NaN;
	return Number.isFinite(d) ? d : 0;
}

/**
 * Build the Web Audio graph once. MediaElementSource can only be created once per element.
 * mediaSource → destination (audible)
 * mediaSource → ChannelSplitter → analyserL / analyserR (metering)
 */
function ensureGraph(): AnalyserPair {
	const el = getAudio();
	if (!audioCtx) {
		audioCtx = new AudioContext();
		mediaSource = audioCtx.createMediaElementSource(el);

		const splitter = audioCtx.createChannelSplitter(2);
		analyserL = audioCtx.createAnalyser();
		analyserR = audioCtx.createAnalyser();
		analyserL.fftSize = 2048;
		analyserR.fftSize = 2048;

		mediaSource.connect(audioCtx.destination);
		mediaSource.connect(splitter);
		splitter.connect(analyserL, 0);
		splitter.connect(analyserR, 1);
	}
	return { left: analyserL!, right: analyserR! };
}

function scheduleCorsGateCheck() {
	clearTimeout(gateCheckTimer);
	gateCheckTimer = setTimeout(() => {
		if (!analyserL || !audio || audio.paused) return;
		const sample = sampleTimeDomain(analyserL);
		const { min, max, ok } = sample;
		console.info(
			'[CDP-XA7ES CORS gate]',
			min,
			max,
			ok ? 'PASS' : 'FAIL (silent — fix /api/stream)'
		);
		(window as Window & { __cdpCorsGate?: typeof sample }).__cdpCorsGate = sample;
	}, 750);
}

function connect(next: EngineCallbacks) {
	callbacks = next;
}

function load(url: string) {
	const el = getAudio();
	const generation = ++loadGeneration;
	intentionalPause = true;
	el.pause();

	/* crossOrigin must be set before src. Only safe when audio is CORS-clean (proxy). */
	if (useProxy()) {
		el.crossOrigin = 'anonymous';
		ensureGraph();
	} else {
		el.removeAttribute('crossOrigin');
	}

	el.src = url;
	el.load();

	const onCanPlay = () => {
		if (generation !== loadGeneration) return;
		el.removeEventListener('canplay', onCanPlay);
		callbacks.onCanPlay?.();
		callbacks.onTimeUpdate?.(el.currentTime, finiteDuration());
	};
	el.addEventListener('canplay', onCanPlay);
}

/**
 * Create and resume the AudioContext from inside a user gesture (the POWER key).
 * Browsers only honour resume() during a gesture, so doing it at power-on means the
 * first play() never has to fight autoplay policy. No-op in artifact mode, where the
 * graph would be tainted without the CORS proxy.
 */
async function unlock() {
	if (typeof window === 'undefined' || !useProxy()) return;
	try {
		ensureGraph();
		if (audioCtx?.state === 'suspended') {
			await audioCtx.resume();
		}
	} catch {
		/* Non-fatal — play() resumes again if this was blocked. */
	}
}

async function play() {
	const el = getAudio();
	intentionalPause = false;
	if (useProxy()) {
		ensureGraph();
		if (audioCtx?.state === 'suspended') {
			await audioCtx.resume();
		}
	}
	try {
		await el.play();
	} catch (err) {
		const message = err instanceof Error ? err.message : 'PLAY FAILED';
		callbacks.onError?.(message);
	}
}

function pause() {
	const el = getAudio();
	intentionalPause = true;
	el.pause();
	callbacks.onPaused?.();
}

function stop() {
	const el = getAudio();
	intentionalPause = true;
	el.pause();
	el.currentTime = 0;
	callbacks.onTimeUpdate?.(0, finiteDuration());
}

function seek(seconds: number) {
	const el = getAudio();
	const d = finiteDuration();
	const clamped = Math.min(Math.max(0, seconds), d > 0 ? d : seconds);
	el.currentTime = clamped;
	callbacks.onTimeUpdate?.(el.currentTime, d);
}

function getCurrentTime() {
	return audio?.currentTime ?? 0;
}

function getDuration() {
	return finiteDuration();
}

function setVolume(value: number) {
	getAudio().volume = Math.min(1, Math.max(0, value));
}

function getAnalysers(): AnalyserPair | null {
	if (!analyserL || !analyserR) return null;
	return { left: analyserL, right: analyserR };
}

export const engine = {
	connect,
	unlock,
	load,
	play,
	pause,
	stop,
	seek,
	getCurrentTime,
	getDuration,
	setVolume,
	getAnalysers
};
