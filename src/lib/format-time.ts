export function formatTime(seconds: number | undefined): string {
	if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '--:--';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
