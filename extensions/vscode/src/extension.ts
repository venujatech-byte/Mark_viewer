import * as vscode from 'vscode';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { webviewHtml } from './html';
import { isEditRequest, minimalEdit } from './edits';

export const viewType = 'mark.reader';

export function activate(context: vscode.ExtensionContext): void {
  const applying = new Set<string>();
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
      const key = document.uri.toString();
      let recovered = false;
      const messages = panel.webview.onDidReceiveMessage(async (message: unknown) => {
        if (message && typeof message === 'object' && 'type' in message && message.type === 'ready') {
          await panel.webview.postMessage(snapshot());
        } else if (message && typeof message === 'object' && 'type' in message && (message.type === 'undo' || message.type === 'redo')) {
          await vscode.commands.executeCommand(message.type);
        } else if (message && typeof message === 'object' && 'type' in message && message.type === 'recover' && 'source' in message && typeof message.source === 'string' && !recovered) {
          recovered = true;
          try {
            const recovery = await vscode.workspace.openTextDocument({ language: 'markdown', content: message.source });
            await vscode.window.showTextDocument(recovery, { preview: false });
          } catch (error) {
            recovered = false;
            void vscode.window.showErrorMessage(`Could not create a recovery document: ${error}. Copy your text before closing Mark.`);
          }
        } else if (isEditRequest(message)) {
          if (applying.has(key) || message.version !== document.version) {
            await panel.webview.postMessage({ ...snapshot(), type: 'editResult', id: message.id, accepted: false, error: 'The document changed elsewhere. Copy your unsent text before reopening.' });
            return;
          }
          applying.add(key);
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
          } finally { applying.delete(key); }
        }
      });
      const changed = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === document) void panel.webview.postMessage(snapshot());
      });
      const saved = vscode.workspace.onDidSaveTextDocument(savedDocument => {
        if (savedDocument === document) void panel.webview.postMessage(snapshot());
      });
      panel.onDidDispose(() => { messages.dispose(); changed.dispose(); saved.dispose(); });
      panel.webview.html = html;
    },
  };
  context.subscriptions.push(vscode.window.registerCustomEditorProvider(viewType, provider, {
    supportsMultipleEditorsPerDocument: true,
  }));
}
