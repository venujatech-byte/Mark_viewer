const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vscode = require('vscode');

exports.run = async function run() {
  const extension = vscode.extensions.getExtension('mark-reader.mark-reader');
  assert.ok(extension, 'Mark extension should be installed for development');
  await extension.activate();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mark-vscode-'));
  try {
    const file = path.join(directory, 'AGENTS.md');
    const original = Buffer.from('\uFEFF---\r\n# comment\r\n---\r\n# Before  ');
    fs.writeFileSync(file, original);
    const uri = vscode.Uri.file(file);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.commands.executeCommand('vscode.openWith', uri, 'mark.reader');
    await vscode.window.tabGroups.activeTab;
    assert.equal(vscode.window.tabGroups.activeTab.input.viewType, 'mark.reader');
    const position = new vscode.Position(document.lineCount - 1, 2);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(uri, position, ' After');
    assert.equal(await vscode.workspace.applyEdit(edit), true);
    assert.equal(document.isDirty, true);
    assert.equal(await document.save(), true);
    assert.deepEqual(fs.readFileSync(file), Buffer.from('\uFEFF---\r\n# comment\r\n---\r\n# Before After  '));
    assert.equal(document.isDirty, false);
  } finally {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
