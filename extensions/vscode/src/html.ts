export function webviewHtml(template: string, csp: string, nonce: string, asset: (name: string) => string): string {
  return template
    .replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`)
    .replace('href="style.css"', `href="${asset('style.css')}"`)
    .replace(/src="([^"]+)"/g, (_match, name: string) => `src="${asset(name === 'app.js' ? 'webview.js' : name)}" nonce="${nonce}"`);
}
