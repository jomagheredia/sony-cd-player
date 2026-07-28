// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

interface ImportMetaEnv {
	/** Set to "false" in the artifact build so the client skips /api/* proxies. */
	readonly VITE_USE_PROXY?: string;
}

export {};
