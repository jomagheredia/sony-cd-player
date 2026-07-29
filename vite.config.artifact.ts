import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/**
 * Artifact target — portable single-file HTML for portfolio drop-in.
 * Uses adapter-static (SPA fallback) + SvelteKit `bundleStrategy: 'inline'`
 * instead of vite-plugin-singlefile (unreliable with SvelteKit's dual build).
 * Client calls archive.org directly (`VITE_USE_PROXY=false`); meter uses
 * the simulated envelope when CORS blocks analysis.
 */
export default defineConfig({
	define: {
		'import.meta.env.VITE_USE_PROXY': JSON.stringify('false')
	},
	build: {
		/* Inline fonts/images referenced from JS/CSS into the bundle. */
		assetsInlineLimit: Infinity
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build-artifact',
				assets: 'build-artifact',
				fallback: 'index.html',
				strict: false
			}),
			/* Relative asset URLs help when opening the file outside a server. */
			paths: {
				relative: true
			},
			output: {
				bundleStrategy: 'inline'
			}
		})
	]
});
