export function webviewHtml(template: string, csp: string, nonce: string, asset: (name: string) => string): string {
  return template
    .replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`)
    .replace('href="style.css"', `href="${asset('style.css')}"`)
    .replace(/src="([^"]+)"/g, (_match, name: string) => `src="${asset(name === 'app.js' ? 'webview.js' : name)}" nonce="${nonce}"`);
}

export function webviewCsp(source: string, nonce: string): string {
  return `default-src 'none'; script-src 'nonce-${nonce}' 'wasm-unsafe-eval'; style-src ${source}; connect-src ${source}; img-src ${source} https: http: blob:; base-uri 'none'; object-src 'none'; frame-src 'none'; form-action 'none'`;
}
