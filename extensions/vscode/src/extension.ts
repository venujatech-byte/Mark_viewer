import * as vscode from 'vscode';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { webviewHtml } from './html';

export const viewType = 'mark.reader';

export function activate(context: vscode.ExtensionContext): void {
  const provider: vscode.CustomTextEditorProvider = {
    resolveCustomTextEditor(document, panel) {
      const media = vscode.Uri.joinPath(context.extensionUri, 'media');
      panel.webview.options = { enableScripts: true, localResourceRoots: [media] };
      const nonce = randomBytes(16).toString('hex');
      const asset = (name: string) => panel.webview.asWebviewUri(vscode.Uri.joinPath(media, name)).toString();
      const csp = `default-src 'none'; script-src 'nonce-${nonce}' 'wasm-unsafe-eval'; style-src ${panel.webview.cspSource}; connect-src ${panel.webview.cspSource}; img-src ${panel.webview.cspSource} https: http: blob:; base-uri 'none'; object-src 'none'; frame-src 'none'; form-action 'none'`;
      const template = readFileSync(vscode.Uri.joinPath(media, 'index.html').fsPath, 'utf8');
      const html = webviewHtml(template, csp, nonce, asset);
      const messages = panel.webview.onDidReceiveMessage((message: unknown) => {
        if (message && typeof message === 'object' && 'type' in message && message.type === 'ready') {
          void panel.webview.postMessage({ type: 'document', path: document.fileName, source: document.getText(), version: document.version, dirty: document.isDirty });
        }
      });
      panel.onDidDispose(() => messages.dispose());
      panel.webview.html = html;
    },
  };
  context.subscriptions.push(vscode.window.registerCustomEditorProvider(viewType, provider, {
    supportsMultipleEditorsPerDocument: true,
  }));
}
