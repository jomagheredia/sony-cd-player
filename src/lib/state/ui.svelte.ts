/* Ephemeral display flashes — search status overlays playback badge briefly. */

export type DisplayFlash = null | 'searching' | 'no-results';

const NO_RESULTS_MS = 2000;

let flash = $state<DisplayFlash>(null);
let flashTimer: ReturnType<typeof setTimeout> | undefined;

function clearTimer() {
	clearTimeout(flashTimer);
	flashTimer = undefined;
}

function setSearching() {
	clearTimer();
	flash = 'searching';
}

function setNoResults() {
	clearTimer();
	flash = 'no-results';
	flashTimer = setTimeout(() => {
		flash = null;
	}, NO_RESULTS_MS);
}

function clear() {
	clearTimer();
	flash = null;
}

export const ui = {
	get flash() {
		return flash;
	},
	setSearching,
	setNoResults,
	clear
};
