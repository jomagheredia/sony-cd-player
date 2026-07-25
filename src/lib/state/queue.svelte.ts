import type { Track } from '$lib/api/types';

/* Placeholder queue for phase 2 — replaced by real /api/resolve data in phase 6. */
const PLACEHOLDER_TRACKS: Track[] = [
	{
		id: 'placeholder-01',
		title: 'Blue Rondo à la Turk',
		artist: 'Dave Brubeck Quartet',
		streamUrl: '',
		duration: 404,
		source: 'archive'
	},
	{
		id: 'placeholder-02',
		title: 'So What',
		artist: 'Miles Davis',
		streamUrl: '',
		duration: 562,
		source: 'archive'
	},
	{
		id: 'placeholder-03',
		title: 'Nocturne Op. 9 No. 2',
		artist: 'Chopin',
		streamUrl: '',
		duration: 273,
		source: 'musopen'
	},
	{
		id: 'placeholder-04',
		title: 'Prelude BWV 846',
		artist: 'Villa-Lobos',
		streamUrl: '',
		duration: 238,
		source: 'archive'
	},
	{
		id: 'placeholder-05',
		title: 'Moonlight Sonata',
		artist: 'Beethoven',
		streamUrl: '',
		duration: 890,
		source: 'musopen'
	}
];

let tracks = $state<Track[]>(PLACEHOLDER_TRACKS);
let shuffle = $state(false);
let repeat = $state<'off' | 'track' | 'all'>('off');
let volume = $state(0.8);

export const queue = {
	get tracks() {
		return tracks;
	},
	set tracks(next: Track[]) {
		tracks = next;
	},
	get shuffle() {
		return shuffle;
	},
	toggleShuffle() {
		shuffle = !shuffle;
	},
	get repeat() {
		return repeat;
	},
	cycleRepeat() {
		repeat = repeat === 'off' ? 'track' : repeat === 'track' ? 'all' : 'off';
	},
	get volume() {
		return volume;
	},
	set volume(next: number) {
		volume = Math.min(1, Math.max(0, next));
	}
};
