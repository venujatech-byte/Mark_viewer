# Shared WASM renderer

Install a current stable Rust toolchain and Node.js 22 or newer, then run from
the repository root:

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.130 --locked
npm run wasm
npm run test:wasm
```

The CLI version must match the exact wasm-bindgen version in mdcore. The build
uses Cargo.lock and emits a browser ES module, TypeScript declarations and the
WASM binary in `crates/mdcore/pkg/`. These are generated assets, ignored by Git.
The npm script uses Bash; on Windows, run it in Git Bash or run its Cargo and
wasm-bindgen commands directly, then give the generated package `type: module`.

```js
import init, { render, editorSource, applyEditorText } from './pkg/mdcore.js';
await init();
const original = '\ufeff# Notes\r\n';
const editorText = editorSource(original);
const edited = applyEditorText(original, editorText.replace('Notes', 'Instructions'));
const html = render(edited);
```

Serve the files over HTTP with `.wasm` as `application/wasm`. A strict CSP needs
`wasm-unsafe-eval` in script-src and permission to fetch the local WASM asset.
No filesystem APIs are exported or compiled for this target. The host owns file
saving, relative resources and external navigation.

Tests initialize the actual generated browser module in Node, compare every
fixture against the native Rust renderer byte-for-byte, and check Unicode,
frontmatter, BOM and all three newline styles. Native filesystem tests remain
part of `cargo test --workspace`.
