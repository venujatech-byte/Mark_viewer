# VS Code extension

The extension is a Custom Text Editor for `.md`, `.markdown`, and `.mdown` files.
It opens rendered by default. Select **Edit** or run **Mark: Toggle Source Editing**
(Ctrl/Command+E) to show the source pane. **Open file** and **Mark: Open Markdown
File** use the native VS Code picker. Save, undo, redo, dirty tabs and external
file conflicts use VS Code's normal document model.

## Build and run from source

Install Node.js 22+, Rust with the `wasm32-unknown-unknown` target, and the
`wasm-bindgen-cli` version listed in [WASM setup](wasm.md). From the repository:

```sh
npm ci
npm run wasm
npm --prefix extensions/vscode ci
npm --prefix extensions/vscode run build
npm --prefix extensions/vscode run lint
npm --prefix extensions/vscode test
code --new-window --extensionDevelopmentPath="$PWD/extensions/vscode" .
```

In the Extension Development Host, open a Markdown file. You can also create a
`.vscode/settings.json` association with `"*.md": "mark.reader"` to make the
custom editor explicit while testing.

## Package and install

Install the VS Code packaging CLI, then package from the extension folder. The
VSIX contains no runtime Node dependencies:

```sh
npm install --global @vscode/vsce@4.1.1
npm --prefix extensions/vscode ci
npm run wasm
npm --prefix extensions/vscode run package
code --install-extension extensions/vscode/mark-reader-0.1.0.vsix
```

`vscode:prepublish` rebuilds the TypeScript and copies the generated WASM and
shared web assets into the package. Build WASM first from the repository root.
The generated `media/` and `dist/` directories are intentionally not checked in.

To choose the editor for a file, use **Reopen With… → Mark Markdown** in VS Code.
The manifest marks Mark as the default for supported extensions; an existing
user `workbench.editorAssociations` setting takes precedence.

Invalid UTF-8, mixed-newline and CR-only files open read-only in the extension.
Use the desktop app for byte-preserving edits to those files. See
[save safety](saving.md) for details.
