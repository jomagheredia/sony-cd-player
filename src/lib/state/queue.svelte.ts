import type { Track } from '$lib/api/types';

/* Phase 3: hardcoded archive.org streams so every row is playable before /api/resolve
   (phase 6) batches real metadata. Prefer public-domain / CC sources where possible. */

const PLACEHOLDER_TRACKS: Track[] = [
	{
		id: 'nocturneineflatmajorop.9no.2',
		title: 'Nocturne Op. 9 No. 2',
		artist: 'Frank Levy / Chopin',
		streamUrl:
			'https://archive.org/download/nocturneineflatmajorop.9no.2/Nocturne%20in%20E%20flat%20major%2C%20Op.%209%20no.%202.mp3',
		duration: 272,
		source: 'archive'
	},
	{
		id: 'Ast0r-SoWhat',
		title: 'So What',
		artist: 'Ast0r / Miles Davis',
		streamUrl: 'https://archive.org/download/Ast0r-SoWhat/01_So_What_-_Ast0r.mp3',
		duration: 565,
		source: 'archive'
	},
	{
		id: 'BlueRondoAlLaTurk-4GuitarArrangementrenderedMidi',
		title: 'Blue Rondo à la Turk',
		artist: 'Paul Staats / Brubeck',
		streamUrl:
			'https://archive.org/download/BlueRondoAlLaTurk-4GuitarArrangementrenderedMidi/BlueRondoAlLaTurk_final.mp3',
		duration: 249,
		source: 'archive'
	},
	{
		id: 'beethoven-symphony-no-5-mvt1',
		title: 'Symphony No. 5 — Allegro con brio',
		artist: 'Bernstein / Beethoven',
		streamUrl:
			'https://archive.org/download/beethoven-symphony-no-5/05%20Beethoven-%20Symphony%20%235%20In%20C%20Minor%2C%20Op.%2067%20-%201.%20Allegro%20Con%20Brio.mp3',
		duration: 518,
		source: 'archive'
	},
	{
		id: 'LudwigVanBeethovenMoonlightSonataAdagioSostenutogetTune.net',
		title: 'Moonlight Sonata',
		artist: 'Beethoven',
		streamUrl:
			'https://archive.org/download/LudwigVanBeethovenMoonlightSonataAdagioSostenutogetTune.net/Ludwig_Van_Beethoven_-_Moonlight_Sonata_Adagio_Sostenuto_%28get-tune.net%29.mp3',
		duration: 328,
		source: 'archive'
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
