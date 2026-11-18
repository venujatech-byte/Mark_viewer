# Roadmap

Each checkbox is a small, reviewable commit. Complete milestones in order; use
follow-up fixes when evidence requires them. No WYSIWYG, cloud, or plugin system.

## 1. Core reading and rendering
- [x] Create the Cargo workspace and mdcore library.
- [x] Render CommonMark headings and paragraphs.
- [x] Read UTF-8 files without changing their bytes.
- [x] Add realistic instruction-file fixtures.
- [x] Test emphasis, lists, and blockquotes.
- [x] Test Unicode and empty documents.
- [x] Escape embedded HTML in rendered output.
- [x] Reject unsafe link destinations.
- [x] Add a renderer example for manual inspection.
- [x] Review core rendering and document its API.

## 2. Frontmatter and safe editing
- [x] Detect YAML frontmatter while retaining its original bytes.
- [x] Render metadata separately from the markdown body.
- [x] Test BOM, CRLF, empty, and unterminated frontmatter.
- [x] Apply validated UTF-8 byte-range edits.
- [x] Test invalid and multibyte edit boundaries.
- [x] Translate source-editor changes into a minimal edit.
- [x] Preserve original newlines through source-editor normalization.
- [x] Save files through an atomic replacement.
- [x] Refuse saves when the file has changed externally.
- [x] Preserve permissions and safely resolve symlink targets.
- [x] Test no-op saves and absent final newlines.
- [x] Test save failures and concurrent edits.
- [x] Review and document file-safety guarantees and limits.

## 3. Desktop reading
- [x] Create the Tauri 2 workspace application.
- [x] Configure a restricted desktop window and CSP.
- [x] Open files through the native picker.
- [x] Keep the active document in backend state.
- [x] Show rendered content in a plain frontend.
- [x] Display frontmatter without raw delimiters.
- [x] Show useful open errors and cancellation behavior.
- [x] Add a first-run open-file screen.
- [x] Build and smoke-test the desktop reader.
- [x] Review desktop command boundaries.

## 4. Desktop editing
- [x] Add source and rendered mode controls.
- [x] Render live previews while typing.
- [x] Save through mdcore with visible dirty state.
- [x] Preserve edits made while saving.
- [x] Confirm before replacing an unsaved document.
- [x] Guard window close with unsaved edits.
- [x] Add open, save, and toggle keyboard shortcuts.
- [x] Surface save conflicts without discarding edits.
- [x] Test frontend editing state transitions.
- [x] Review and smoke-test the full desktop edit cycle.

## 5. Markdown rendering polish
- [x] Enable and test tables.
- [x] Enable and test task lists.
- [x] Enable and test footnotes.
- [x] Enable and test strikethrough.
- [x] Style fenced and inline code blocks.
- [x] Add syntax highlighting with an existing maintained library.
- [x] Open safe external links through the host.
- [x] Resolve local markdown links relative to the current file.
- [x] Resolve local images with restricted access.
- [x] Give tables and long code safe overflow behavior.
- [x] Test malicious markdown and resource URLs.
- [x] Review rendering parity and security.

## 6. UI polish
- [x] Set the editor's typography and reading measure.
- [x] Follow system light and dark themes.
- [x] Polish toolbar and document identity.
- [x] Add accessible focus and semantic regions.
- [x] Adapt edit panes to narrow windows.
- [x] Add clear busy, empty, and error states.
- [x] Respect reduced motion and forced colors.
- [x] Verify keyboard-only operation.
- [x] Inspect light and dark screenshots at three widths.
- [x] Review and simplify shared frontend assets.

## 7. WASM
- [x] Add optional wasm-bindgen exports without filesystem access.
- [x] Build the mdcore browser WASM package.
- [x] Test native and WASM rendering parity.
- [x] Test WASM Unicode and frontmatter handling.
- [x] Document the reproducible WASM build command.

## 8. VS Code custom editor
- [x] Scaffold the TypeScript extension manifest and build.
- [x] Register a Custom Text Editor for markdown files.
- [x] Package shared rendering assets and WASM.
- [x] Render document content through mdcore WASM.
- [x] Apply source edits through WorkspaceEdit.
- [x] Synchronize undo, redo, and external changes.
- [x] Reject stale webview edits.
- [x] Preserve BOM and newline conventions.
- [x] Integrate native save and dirty tracking.
- [x] Constrain webview CSP and resource roots.
- [ ] Resolve relative images through webview URIs.
- [ ] Handle safe links through VS Code.
- [ ] Add extension open and toggle commands.
- [ ] Dispose listeners and multiple editor instances safely.
- [ ] Test extension message and edit validation.
- [ ] Package and smoke-test the installable extension.
- [ ] Review desktop and extension behavior together.

## 9. Documentation and packaging
- [ ] Write README setup and desktop usage.
- [ ] Document markdown and frontmatter behavior.
- [ ] Document save safety and conflict recovery.
- [ ] Document desktop packaging prerequisites and commands.
- [ ] Document VS Code installation and editor selection.
- [ ] Add reproducible project verification commands.
- [ ] Add continuous integration for Rust, frontend, and WASM.
- [ ] Record platform support and remaining limitations.
- [ ] Run final formatting, lint, tests, and packaging checks.
- [ ] Review the repository and verify 100+ meaningful commits.
