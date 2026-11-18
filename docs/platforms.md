# Platform support and limits

The desktop reader and edit cycle were built and exercised on Fedora Linux x86_64
with Tauri 2 and WebKitGTK 4.1. The VS Code development extension was exercised
on Linux x86_64 with VS Code 1.144.1, including WASM rendering, source editing,
and native Save. The Rust and Node test suites also run in the Ubuntu 24.04 CI
workflow.

Windows and macOS builds have not been run here. Tauri installers require
platform-specific build dependencies, icon assets, signing and testing on those
operating systems. The repository currently disables Tauri bundling; its release
build produces an executable only. No platform installer is included.

The VS Code extension currently supports local file documents only. Invalid
UTF-8, mixed newline and CR-only files are rendered read-only there. The desktop
app is the byte-preserving editor for those files. Browser VS Code, remote file
systems and non-Linux desktop packaging have not been validated. VS Code save
participants configured by users may rewrite content according to their own
settings.
