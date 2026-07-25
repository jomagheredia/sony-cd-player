/* Normalized track shape — every source (archive.org, jamendo, musopen) resolves to this,
   so the player never knows where a track came from. */
export interface Track {
	id: string;
	title: string;
	artist: string;
	streamUrl: string;
	duration?: number; // seconds, resolved on load if absent
	source: 'archive' | 'jamendo' | 'musopen';
}
