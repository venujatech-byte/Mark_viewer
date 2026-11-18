export function editingError(bytes: Uint8Array, text: string, dirty: boolean): string | undefined {
  let original: string;
  try { original = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return 'Mark only edits valid UTF-8 files. Reopen with the correct encoding in the text editor.'; }
  const endings = new Set(original.match(/\r\n|\r|\n/g));
  if (endings.has('\r') || endings.size > 1) {
    return 'This file uses mixed or CR-only newlines. Mark keeps it read-only because VS Code would normalize those bytes. Use the desktop app to edit it safely.';
  }
  if (!dirty && original !== text) return 'The decoded file differs from the editor buffer. Reopen with UTF-8 encoding before editing.';
  return undefined;
}
