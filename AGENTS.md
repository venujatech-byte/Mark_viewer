# Mark

## Goal
A local markdown reader/editor that opens instruction and memory files in a
properly rendered view, preserves source bytes, and ships as a desktop app and
then a VS Code Custom Text Editor. ROADMAP.md is the task list.

## Principles
1. KISS: choose the simplest solution that works.
2. YAGNI: build only the roadmap; no speculative features.
3. Ponytail: solve the whole problem with the least new code. Never cut file
   safety, validation, error handling, or accessibility.
4. Read every diff before committing. Delete dead code and simplify.
5. Prefer std and maintained crates. Query crates.io's max_stable_version before
   pinning; justify each dependency here.

## Architecture
- Cargo workspace: crates/mdcore is pure Rust; parsing never rewrites source.
- apps/desktop: Tauri 2 Rust commands with a plain HTML/CSS/JavaScript frontend.
  JavaScript is sufficient for the small frontend; the extension uses TypeScript.
- extensions/vscode: Custom Text Editor backed by the same mdcore WASM renderer.
  Build this only after the desktop edit cycle works.
- Source text is the document. HTML is disposable. YAML is retained verbatim,
  including comments and formatting; do not deserialize and reserialize it.
- UTF-8 only: reject invalid encoding instead of replacing bytes. Preserve BOM,
  newlines, trailing whitespace and missing final newline. Fail on save conflicts.
- Treat markdown as untrusted. Escape HTML, restrict URLs, use CSP, and never give
  a rendered document access to host commands.

## Commands
Once the workspace exists:
- cargo build
- cargo fmt --all -- --check
- cargo clippy --workspace --all-targets -- -D warnings
- cargo test --workspace
Add frontend, WASM and packaging commands here as they become available.

## Commits and work loop
Read this file and ROADMAP.md, take the next unchecked task, implement the
smallest complete change, format/lint/test, read the diff, then commit. Tick the
task in that commit. Conventional Commits only; preserve history. Each commit
must build and pass tests. Bootstrap documentation precedes compilable code.
At each milestone, review its connected code and simplify where justified.
Aim for 100+ meaningful commits; never create empty or artificial count padding.
Do not rewrite pre-existing history. This repo began with a license commit.
Work one task at a time; no remote is configured, so pull/rebase is inapplicable.

## Dependency decisions
Verified against crates.io on 2026-11-18 before use:
- pulldown-cmark 0.13.6: maintained CommonMark event parser, small and WASM-friendly;
  event filtering lets both hosts share safe HTML without source reserialization.
- tauri 2.12.6 / tauri-build 2.7.5: requested native desktop shell and build support.
- tauri-plugin-dialog 2.8.4: native open picker and unsaved-change confirmations.
- tauri-plugin-opener 2.7.3: open validated external URLs via the operating system.
- serde 1.0.229: Tauri command payload serialization.
- tempfile 3.27.0: same-directory temporary files and atomic persistence for saves.
- wasm-bindgen 0.2.130: requested browser bindings for the shared Rust renderer.

## References
- https://v2.tauri.app/start/prerequisites/
- https://v2.tauri.app/develop/calling-rust/
- https://v2.tauri.app/security/capabilities/
- https://code.visualstudio.com/api/extension-guides/custom-editors
- https://rustwasm.github.io/docs/wasm-bindgen/

## Core rendering review
`render(&str)` returns a safe HTML fragment; `Document` retains UTF-8 source.
The hosts still own CSP, resource resolution, and link navigation. The renderer
example is `cargo run -p mdcore --example render -- FILE.md`. All CommonMark and
untrusted-HTML tests passed at milestone 1 review; URL filtering uses one event
path instead of reconstructing link/image fields.

## File safety review
`FileDocument` canonicalizes an existing regular file, records its original UTF-8
bytes, and atomically persists a synced temporary file in the same directory.
No-op saves do not touch timestamps. Saves compare disk bytes twice, preserve
permissions, reject read-only files and Unix hard links, and retain unsaved text
on errors. Symlinks opened initially resolve to their target; later replacement
of that target by a symlink is rejected. No format or final newline is inserted.

Limits: external programs do not share a lock, so a writer racing the final
compare/rename can still conflict. Atomic replacement preserves permission bits,
not extended attributes, ACLs, ownership, or inode identity. Network filesystems
may offer weaker durability. A directory-sync error after rename means data may
already be saved. The source editor applies one minimal replacement per input;
new lines use the first existing newline style, untouched ranges keep their own.

## Desktop design
Framed sheet, seed 1270020764, chosen for long reading/editing sessions. System
fonts are intentional. A pale green-grey frame and book-shaped M are Mark's face;
the instruction file itself, its metadata disclosure and source/preview pair are
the signature. The main question is “What does this file say?” The rendered
article gets the space; open/edit/save stay one click away. No sidebar or sample
analytics are needed. The small native icon is generated from icons/mark.svg.
