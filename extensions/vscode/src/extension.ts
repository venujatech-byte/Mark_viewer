import * as vscode from 'vscode';

export const viewType = 'mark.reader';

export function activate(context: vscode.ExtensionContext): void {
  const provider: vscode.CustomTextEditorProvider = {
    resolveCustomTextEditor(_document, panel) {
      panel.webview.options = { enableScripts: false, localResourceRoots: [] };
      panel.webview.html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'"></head><body><main><h1>Mark</h1><p>Preparing the markdown renderer.</p></main></body></html>';
    },
  };
  context.subscriptions.push(vscode.window.registerCustomEditorProvider(viewType, provider, {
    supportsMultipleEditorsPerDocument: true,
  }));
}
