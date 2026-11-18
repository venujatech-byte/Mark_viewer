# File safety and conflicts

The desktop app accepts UTF-8 files and preserves the original BOM, newline
bytes, whitespace, YAML text and final-newline state. Saving writes a temporary
file in the same directory and replaces the selected file atomically. A no-op
save leaves the file and its timestamp alone. If the disk contents differ from
the version Mark opened, Save reports a conflict and keeps the edit in memory;
reopen or copy the text before resolving the conflict outside Mark.

VS Code uses its native text document and save pipeline. UTF-8 BOM, LF and CRLF
are supported. Invalid UTF-8, mixed newline and CR-only files open read-only in
the extension because VS Code normalizes those bytes. Use the desktop app to edit
those files. VS Code formatters and save participants can intentionally change
text on save.

The desktop app preserves permission bits but atomic replacement cannot retain
ownership, ACLs, extended attributes or inode identity. External writers can
still race the final conflict check, and network filesystems may provide weaker
durability. A directory-sync error reported after replacement can mean the
contents were already saved. These limits do not apply to VS Code's save engine.
