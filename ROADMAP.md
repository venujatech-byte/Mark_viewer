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
- [ ] Render metadata separately from the markdown body.
- [ ] Test BOM, CRLF, empty, and unterminated frontmatter.
- [ ] Apply validated UTF-8 byte-range edits.
- [ ] Test invalid and multibyte edit boundaries.
- [ ] Translate source-editor changes into a minimal edit.
- [ ] Preserve original newlines through source-editor normalization.
- [ ] Save files through an atomic replacement.
- [ ] Refuse saves when the file has changed externally.
- [ ] Preserve permissions and safely resolve symlink targets.
- [ ] Test no-op saves and absent final newlines.
- [ ] Test save failures and concurrent edits.
- [ ] Review and document file-safety guarantees and limits.

## 3. Desktop reading
- [ ] Create the Tauri 2 workspace application.
- [ ] Configure a restricted desktop window and CSP.
- [ ] Open files through the native picker.
- [ ] Keep the active document in backend state.
- [ ] Show rendered content in a plain frontend.
- [ ] Display frontmatter without raw delimiters.
- [ ] Show useful open errors and cancellation behavior.
- [ ] Add a first-run open-file screen.
- [ ] Build and smoke-test the desktop reader.
- [ ] Review desktop command boundaries.

## 4. Desktop editing
- [ ] Add source and rendered mode controls.
- [ ] Render live previews while typing.
- [ ] Save through mdcore with visible dirty state.
- [ ] Preserve edits made while saving.
- [ ] Confirm before replacing an unsaved document.
- [ ] Guard window close with unsaved edits.
- [ ] Add open, save, and toggle keyboard shortcuts.
- [ ] Surface save conflicts without discarding edits.
- [ ] Test frontend editing state transitions.
- [ ] Review and smoke-test the full desktop edit cycle.

## 5. Markdown rendering polish
- [ ] Enable and test tables.
- [ ] Enable and test task lists.
- [ ] Enable and test footnotes.
- [ ] Enable and test strikethrough.
- [ ] Style fenced and inline code blocks.
- [ ] Add syntax highlighting with an existing maintained library.
- [ ] Open safe external links through the host.
- [ ] Resolve local markdown links relative to the current file.
- [ ] Resolve local images with restricted access.
- [ ] Give tables and long code safe overflow behavior.
- [ ] Test malicious markdown and resource URLs.
- [ ] Review rendering parity and security.

## 6. UI polish
- [ ] Set the editor's typography and reading measure.
- [ ] Follow system light and dark themes.
- [ ] Polish toolbar and document identity.
- [ ] Add accessible focus and semantic regions.
- [ ] Adapt edit panes to narrow windows.
- [ ] Add clear busy, empty, and error states.
- [ ] Respect reduced motion and forced colors.
- [ ] Verify keyboard-only operation.
- [ ] Inspect light and dark screenshots at three widths.
- [ ] Review and simplify shared frontend assets.

## 7. WASM
- [ ] Add optional wasm-bindgen exports without filesystem access.
- [ ] Build the mdcore browser WASM package.
- [ ] Test native and WASM rendering parity.
- [ ] Test WASM Unicode and frontmatter handling.
- [ ] Document the reproducible WASM build command.

## 8. VS Code custom editor
- [ ] Scaffold the TypeScript extension manifest and build.
- [ ] Register a Custom Text Editor for markdown files.
- [ ] Package shared rendering assets and WASM.
- [ ] Render document content through mdcore WASM.
- [ ] Apply source edits through WorkspaceEdit.
- [ ] Synchronize undo, redo, and external changes.
- [ ] Reject stale webview edits.
- [ ] Preserve BOM and newline conventions.
- [ ] Integrate native save and dirty tracking.
- [ ] Constrain webview CSP and resource roots.
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
