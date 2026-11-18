import * as vscode from 'vscode';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { webviewHtml } from './html';
import { isEditRequest, minimalEdit } from './edits';

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
      const snapshot = () => ({ type: 'document', path: document.fileName, source: document.getText(), version: document.version, dirty: document.isDirty });
      let applying = false;
      const messages = panel.webview.onDidReceiveMessage(async (message: unknown) => {
        if (message && typeof message === 'object' && 'type' in message && message.type === 'ready') {
          await panel.webview.postMessage(snapshot());
        } else if (isEditRequest(message)) {
          if (applying || message.version !== document.version) {
            await panel.webview.postMessage({ ...snapshot(), type: 'editResult', id: message.id, accepted: false, error: 'The document changed elsewhere. Copy your unsent text before reopening.' });
            return;
          }
          applying = true;
          try {
            const change = minimalEdit(document.getText(), message.source);
            let accepted = true;
            if (change) {
              const edit = new vscode.WorkspaceEdit();
              edit.replace(document.uri, new vscode.Range(document.positionAt(change.start), document.positionAt(change.end)), change.text);
              accepted = await vscode.workspace.applyEdit(edit);
            }
            await panel.webview.postMessage({ ...snapshot(), type: 'editResult', id: message.id, accepted });
          } catch (error) {
            await panel.webview.postMessage({ ...snapshot(), type: 'editResult', id: message.id, accepted: false, error: String(error) });
          } finally { applying = false; }
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
