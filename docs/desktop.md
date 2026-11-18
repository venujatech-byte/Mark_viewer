# Desktop build

The desktop app uses Tauri 2 with a plain web frontend. On Linux, install the
system packages listed by the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)
for your distribution, plus stable Rust and the Tauri CLI:

```sh
cargo install tauri-cli --locked
cargo run -p mark-desktop
```

To build the release executable, run:

```sh
cargo build --release -p mark-desktop
```

Tauri's CLI can run the same release build from the app directory:

```sh
cd apps/desktop
cargo tauri build
```

The current configuration sets `bundle.active` to `false`, so this produces the
application executable without a platform installer. Distribution packages
need platform-specific icon assets, signing and bundler configuration; build and
sign them on each target platform. Tauri documents the available formats and
platform requirements in its [distribution guide](https://v2.tauri.app/distribute/).
