/* Audio engine — HTMLAudioElement only in phase 3.
   Web Audio graph (AnalyserNode / ChannelSplitterNode) lands after the CORS gate. */

export type EngineCallbacks = {
	onPlaying?: () => void;
	onPaused?: () => void;
	onEnded?: () => void;
	onError?: (reason: string) => void;
	onTimeUpdate?: (currentTime: number, duration: number) => void;
	/** Fires once the newly loaded source can play (metadata + buffer). */
	onCanPlay?: () => void;
};

let audio: HTMLAudioElement | null = null;
let callbacks: EngineCallbacks = {};
let intentionalPause = false;
let loadGeneration = 0;

function getAudio(): HTMLAudioElement {
	if (typeof window === 'undefined') {
		throw new Error('Audio engine is browser-only');
	}
	if (!audio) {
		audio = new Audio();
		audio.preload = 'auto';
		/* Do not set crossOrigin here — that requires CORS-clean audio from /api/stream.
		   Playback works without it; analysis needs the proxy (phase 4). */

		audio.addEventListener('loadedmetadata', () => {
			callbacks.onTimeUpdate?.(audio!.currentTime, finiteDuration());
		});
		audio.addEventListener('playing', () => {
			intentionalPause = false;
			callbacks.onPlaying?.();
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

function connect(next: EngineCallbacks) {
	callbacks = next;
}

function load(url: string) {
	const el = getAudio();
	const generation = ++loadGeneration;
	intentionalPause = true;
	el.pause();
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

async function play() {
	const el = getAudio();
	intentionalPause = false;
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

export const engine = {
	connect,
	load,
	play,
	pause,
	stop,
	seek,
	getCurrentTime,
	getDuration,
	setVolume
};
