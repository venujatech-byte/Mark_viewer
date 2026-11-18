#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cargo build --locked -p mdcore --release --target wasm32-unknown-unknown --features wasm --lib
wasm-bindgen target/wasm32-unknown-unknown/release/mdcore.wasm --target web --out-dir crates/mdcore/pkg
printf '{"type":"module","private":true}\n' > crates/mdcore/pkg/package.json
