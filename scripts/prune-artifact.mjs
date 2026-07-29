import { rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `bundleStrategy: 'inline'` embeds JS/CSS in index.html, but adapter-static
 * still emits sidecar `_app/` + robots.txt. Portfolio drop-in is the HTML alone.
 */
const root = join(process.cwd(), 'build-artifact');
const keep = new Set(['index.html']);

if (!existsSync(root)) {
	console.error('prune-artifact: build-artifact/ missing — run the artifact build first');
	process.exit(1);
}

for (const name of readdirSync(root)) {
	if (keep.has(name)) continue;
	rmSync(join(root, name), { recursive: true, force: true });
	console.log(`prune-artifact: removed ${name}`);
}

console.log('prune-artifact: ready — build-artifact/index.html');
