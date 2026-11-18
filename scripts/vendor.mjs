import { copyFileSync, mkdirSync } from 'node:fs';
const output = new URL('../apps/desktop/web/vendor/', import.meta.url);
const input = new URL('../node_modules/@highlightjs/cdn-assets/', import.meta.url);
mkdirSync(output, { recursive: true });
for (const file of ['highlight.min.js', 'LICENSE']) {
  copyFileSync(new URL(file, input), new URL(file, output));
}
