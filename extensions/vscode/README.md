# Mark — Markdown Reader

Open `.md`, `.markdown`, and `.mdown` files in a rendered reading view. Mark
uses the same Rust Markdown renderer as its desktop app and shows YAML
frontmatter separately from the document body.

Use **Edit** to open the Markdown source beside its preview. **Save** and
Ctrl/Command+S use VS Code's native document save behavior; undo and redo use the
native document history. Click **Open file** to choose another Markdown file.

Mark preserves the UTF-8 BOM and consistent LF or CRLF line endings through
VS Code. Invalid UTF-8, mixed-newline, and CR-only files are read-only in the
extension because the VS Code text model normalizes their bytes. Use the Mark
desktop app to edit those files safely.

The extension only supports local file documents. Raw HTML is rendered as text;
external links are opened through VS Code, and local images are limited to the
Markdown file's folder.
