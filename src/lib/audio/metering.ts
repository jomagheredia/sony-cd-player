/* Analyser sampling helpers. Peak/RMS segment mapping lands in phase 5;
   phase 4 only needs the CORS gate check (time-domain min/max ≠ 128). */

export type TimeDomainSample = {
	min: number;
	max: number;
	/** False when the graph is silent (every sample stuck at 128). */
	ok: boolean;
};

export function sampleTimeDomain(analyser: AnalyserNode): TimeDomainSample {
	const data = new Uint8Array(analyser.frequencyBinCount);
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
