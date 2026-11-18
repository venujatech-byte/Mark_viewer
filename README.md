# Mark

Mark is a local Markdown reader and source editor for instruction and memory
files. It renders CommonMark, shows YAML frontmatter separately, and keeps file
text as the source of truth. The desktop app can edit files without normalizing
BOMs or line endings. The VS Code Custom Text Editor shares the same Rust/WASM
renderer and uses VS Code's native document, undo, conflict and save handling.

## Run the desktop app

Install Rust and the [Tauri 2 Linux prerequisites](https://v2.tauri.app/start/prerequisites/),
then run:

```sh
cargo run -p mark-desktop
```

Use **Open file** to choose a Markdown file. **Edit** shows source next to the
rendered preview; **Save** writes the edit. Ctrl/Command+O opens, Ctrl/Command+E
toggles source, and Ctrl/Command+S saves.

## Use the VS Code extension

The Custom Text Editor opens `.md`, `.markdown`, and `.mdown` files in a rendered
view by default. Use the Edit button or Ctrl/Command+E for source. VS Code owns
save and undo; Mark saves through the native document model. See
[VS Code setup](docs/vscode.md) for development and installation commands.

## Development checks

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
node --test apps/desktop/tests/*.test.cjs
npm ci
npm run vendor
npm run test
npm run wasm
npm run test:wasm
npm ci --prefix extensions/vscode
npm --prefix extensions/vscode run build
npm --prefix extensions/vscode run lint
npm --prefix extensions/vscode test
```

See [Markdown and frontmatter](docs/markdown.md), [save safety](docs/saving.md),
[desktop packaging](docs/desktop.md), and [platform support](docs/platforms.md).
The WASM build steps are in [docs/wasm.md](docs/wasm.md).
