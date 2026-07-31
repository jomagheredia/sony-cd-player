/* Analyser sampling → per-channel peak / RMS → 14-segment levels with peak-hold. */

export const SEGMENT_COUNT = 14;
export const PEAK_HOLD_MS = 1200;
export const PEAK_DECAY_MS = 80;

/** Floor/ceiling for dB → segment mapping (tuned so classical + loud tracks both move). */
const MIN_DB = -48;
const MAX_DB = -3;

export type TimeDomainSample = {
	min: number;
	max: number;
	/** False when the graph is silent (every sample stuck at 128). */
	ok: boolean;
};

export type ChannelLevels = {
	/** Live bar level from RMS/peak, 0–14. */
	level: number;
	/** Peak-hold level, 0–14 (decays after hold). */
	hold: number;
	/** Display = max(level, hold) unless reduced-motion (then level only). */
	display: number;
};

export type PeakHoldState = {
	level: number;
	holdUntil: number;
	lastDecay: number;
};

export function sampleTimeDomain(
	analyser: AnalyserNode,
	buffer?: Uint8Array<ArrayBuffer>
): TimeDomainSample {
	const data = buffer ?? new Uint8Array(analyser.fftSize);
	analyser.getByteTimeDomainData(data);
	let min = 255;
	let max = 0;
	for (let i = 0; i < data.length; i++) {
		const v = data[i]!;
		if (v < min) min = v;
		if (v > max) max = v;
	}
	return { min, max, ok: !(min === 128 && max === 128) };
}

/** Peak (0–1) and RMS (0–1) from unsigned 8-bit time-domain data centered at 128. */
export function measureTimeDomain(data: Uint8Array): { peak: number; rms: number } {
	let peak = 0;
	let sumSq = 0;
	const n = data.length;
	for (let i = 0; i < n; i++) {
		const a = Math.abs(data[i]! - 128) / 128;
		if (a > peak) peak = a;
		sumSq += a * a;
	}
	return { peak, rms: Math.sqrt(sumSq / Math.max(1, n)) };
}

function amplitudeToDb(norm: number): number {
	return 20 * Math.log10(Math.max(norm, 1e-6));
}

export function amplitudeToSegments(norm: number): number {
	const db = amplitudeToDb(norm);
	const t = (db - MIN_DB) / (MAX_DB - MIN_DB);
	return Math.max(0, Math.min(SEGMENT_COUNT, Math.round(t * SEGMENT_COUNT)));
}

/** Instantaneous bar level: louder of RMS and peak (peak meters should react to transients). */
export function levelsFromAnalyser(
	analyser: AnalyserNode,
	buffer: Uint8Array<ArrayBuffer>
): number {
	analyser.getByteTimeDomainData(buffer);
	const { peak, rms } = measureTimeDomain(buffer);
	return Math.max(amplitudeToSegments(rms), amplitudeToSegments(peak));
}

export function createPeakHold(): PeakHoldState {
	return { level: 0, holdUntil: 0, lastDecay: 0 };
}

export function updatePeakHold(hold: PeakHoldState, current: number, now: number): PeakHoldState {
	if (current >= hold.level) {
		return { level: current, holdUntil: now + PEAK_HOLD_MS, lastDecay: now };
	}
	if (now < hold.holdUntil) return hold;
	if (now - hold.lastDecay >= PEAK_DECAY_MS) {
		return {
			level: Math.max(current, hold.level - 1),
			holdUntil: hold.holdUntil,
			lastDecay: now
		};
	}
	return hold;
}

export function channelDisplay(
	level: number,
	hold: PeakHoldState,
	reducedMotion: boolean
): ChannelLevels {
	if (reducedMotion) {
		return { level, hold: level, display: level };
	}
	return { level, hold: hold.level, display: Math.max(level, hold.level) };
}

/**
 * Artifact-mode envelope when CORS analysis isn't available.
 * Plausible motion from playback position + light randomness — never a dead meter.
 *
 * Shaped directly in segments rather than in amplitude. The -48..-3 dB window spans
 * 14 segments, so ~3.2 dB per segment: any amplitude curve wide enough to travel the
 * scale has to swing ~20x, and anything narrower reads as a bar parked near the top.
 * Layers are phrase (slow swell), bar (medium), transient (hits), flutter, noise —
 * so the meter breathes on two timescales the way programme material does.
 */
export function simulateEnvelope(currentTime: number, channel: 'L' | 'R'): number {
	const phase = channel === 'L' ? 0 : 0.9;
	const phrase = 7.2 + 2.8 * Math.sin(currentTime * 0.28 + phase);
	const bar = 1.4 * Math.sin(currentTime * 0.95 + phase * 1.7);
	const transient = 2.0 * Math.abs(Math.sin(currentTime * 2.4 + phase)) ** 4;
	const flutter = 0.45 * Math.sin(currentTime * 9.7 + phase * 3);
	const noise = Math.random() * 0.45;
	const segments = phrase + bar + transient + flutter + noise;
	return Math.max(0, Math.min(SEGMENT_COUNT, Math.round(segments)));
}
