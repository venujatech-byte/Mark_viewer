#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cargo fmt --all -- --check
cargo build --workspace --all-features
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
npm test
npm run wasm
npm run test:wasm
npm --prefix extensions/vscode run build
npm --prefix extensions/vscode run lint
npm --prefix extensions/vscode test
