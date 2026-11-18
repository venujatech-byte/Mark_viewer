import * as vscode from 'vscode';
import { dirname, extname } from 'node:path';
import { readFileSync, realpathSync } from 'node:fs';
import { realpath } from 'node:fs/promises';
import { imagePath, linkUrl } from './resources';
import { randomBytes } from 'node:crypto';
import { webviewHtml, webviewCsp } from './html';
import { editingError } from './encoding';
import { isEditRequest, minimalEdit } from './edits';

export const viewType = 'mark.reader';

export function activate(context: vscode.ExtensionContext): void {
  const applying = new Set<string>();
  const provider: vscode.CustomTextEditorProvider = {
    resolveCustomTextEditor(document, panel) {
      const media = vscode.Uri.joinPath(context.extensionUri, 'media');
      const roots = [media];
      if (document.uri.scheme === 'file') roots.push(vscode.Uri.file(realpathSync(dirname(document.uri.fsPath))));
      panel.webview.options = { enableScripts: true, enableCommandUris: false, localResourceRoots: roots };
      const nonce = randomBytes(16).toString('hex');
      const asset = (name: string) => panel.webview.asWebviewUri(vscode.Uri.joinPath(media, name)).toString();
      const csp = webviewCsp(panel.webview.cspSource, nonce);
      const template = readFileSync(vscode.Uri.joinPath(media, 'index.html').fsPath, 'utf8');
      const html = webviewHtml(template, csp, nonce, asset);
      const safetyError = () => {
        if (document.uri.scheme !== 'file') return 'Mark currently supports local UTF-8 files.';
        try { return editingError(readFileSync(document.uri.fsPath), document.getText(), document.isDirty); }
        catch (error) { return `Could not validate the original file: ${error}`; }
      };
      const snapshot = () => ({ type: 'document', path: document.fileName, source: document.getText(), version: document.version, dirty: document.isDirty, editingError: safetyError() });
      const key = document.uri.toString();
      let recovered = false;
      const messages = panel.webview.onDidReceiveMessage(async (message: unknown) => {
        if (message && typeof message === 'object' && 'type' in message && message.type === 'ready') {
          await panel.webview.postMessage(snapshot());
        } else if (message && typeof message === 'object' && 'type' in message && message.type === 'link' && 'url' in message && typeof message.url === 'string') {
          try {
            const url = await linkUrl(document.uri.fsPath, message.url);
            if (['https:', 'http:', 'mailto:'].includes(url.protocol)) await vscode.env.openExternal(vscode.Uri.parse(url.toString()));
            else if (url.protocol === 'file:' && document.uri.scheme === 'file' && ['.md', '.markdown', '.mdown'].includes(extname(url.pathname).toLowerCase())) {
              const path = await realpath(url);
              await vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(path), viewType);
            }
          } catch { /* Invalid or unsupported links stay inert. */ }
        } else if (message && typeof message === 'object' && 'type' in message && message.type === 'image' && 'id' in message && Number.isSafeInteger(message.id) && 'url' in message && typeof message.url === 'string') {
          try {
            const path = await imagePath(document.uri.fsPath, message.url);
            await panel.webview.postMessage({ type: 'imageResult', id: message.id, uri: panel.webview.asWebviewUri(vscode.Uri.file(path)).toString() });
          } catch { await panel.webview.postMessage({ type: 'imageResult', id: message.id }); }
        } else if (message && typeof message === 'object' && 'type' in message && message.type === 'save') {
          try {
            if (safetyError()) throw new Error(safetyError());
            const saved = await document.save();
            await panel.webview.postMessage({ type: 'saveResult', saved, dirty: document.isDirty });
          } catch (error) {
            await panel.webview.postMessage({ type: 'saveResult', saved: false, error: String(error) });
          }
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
          if (safetyError() || applying.has(key) || message.version !== document.version) {
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
