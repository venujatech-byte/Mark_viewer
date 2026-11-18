import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
const root = new URL('../../../', import.meta.url);
const media = new URL('../media/', import.meta.url);
mkdirSync(media, { recursive: true });
for (const name of ['index.html', 'style.css', 'render.js']) {
  copyFileSync(new URL(`apps/desktop/web/${name}`, root), new URL(name, media));
}
cpSync(new URL('apps/desktop/web/vendor/', root), new URL('vendor/', media), { recursive: true });
cpSync(new URL('crates/mdcore/pkg/', root), new URL('pkg/', media), { recursive: true });
copyFileSync(new URL('apps/desktop/icons/icon.png', root), new URL('icon.png', media));
copyFileSync(new URL('../webview/app.js', import.meta.url), new URL('webview.js', media));
