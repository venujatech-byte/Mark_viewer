import init, { render, editorSource, applyEditorText } from './pkg/mdcore.js';

const vscode = acquireVsCodeApi();
const source = document.querySelector('#source');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const error = document.querySelector('#error');
const toggle = document.querySelector('#toggle');
let raw = '', version = 0, sequence = 0, pending = null, queued = false, blocked = false, loaded = false;
source.readOnly = true;
document.querySelector('#open').disabled = true;

function show(text) {
  preview.innerHTML = render(text) || '<p class="empty-document">This file is empty.</p>';
  window.decorateMarkdown(preview);
}

function sendEdit() {
  if (pending !== null || blocked || !loaded) return;
  const updated = applyEditorText(raw, source.value);
  if (updated === raw) return;
  pending = ++sequence;
  vscode.postMessage({ type: 'edit', id: pending, version, source: updated });
}

window.addEventListener('message', event => {
  const message = event.data;
  if (message.type === 'editResult') {
    if (message.id !== pending) return;
    pending = null;
    if (!message.accepted) {
      blocked = true;
      source.readOnly = true;
      status.textContent = 'Unsent changes';
      error.textContent = message.error || 'The edit was rejected. Copy your source text before reopening.';
      return;
    }
    raw = message.source;
    version = message.version;
    status.textContent = message.dirty ? 'Unsaved changes' : 'Saved';
    if (queued) { queued = false; sendEdit(); }
    return;
  }
  if (message.type !== 'document' || pending !== null || blocked) return;
  const start = loaded ? source.selectionStart : 0;
  const end = loaded ? source.selectionEnd : 0;
  raw = message.source;
  version = message.version;
  document.querySelector('#welcome').hidden = true;
  document.querySelector('#filename').textContent = message.path.split(/[\\/]/).pop();
  source.value = editorSource(raw);
  source.setSelectionRange(Math.min(start, source.value.length), Math.min(end, source.value.length));
  source.readOnly = false;
  show(raw);
  status.textContent = message.dirty ? 'Unsaved changes' : 'Saved';
  toggle.disabled = false;
  loaded = true;
});

source.addEventListener('input', () => {
  if (blocked || !loaded) return;
  queued = pending !== null;
  show(applyEditorText(raw, source.value));
  status.textContent = 'Updating document…';
  sendEdit();
});

source.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && ['z', 'y'].includes(event.key.toLowerCase())) {
    event.preventDefault();
    if (pending === null && !blocked) vscode.postMessage({ type: event.shiftKey || event.key.toLowerCase() === 'y' ? 'redo' : 'undo' });
  }
});

toggle.addEventListener('click', () => {
  const pane = document.querySelector('#source-pane');
  pane.hidden = !pane.hidden;
  document.querySelector('#panes').classList.toggle('editing', !pane.hidden);
  toggle.setAttribute('aria-pressed', String(!pane.hidden));
  if (!pane.hidden) source.focus();
  else preview.focus();
});

try {
  status.textContent = 'Loading renderer…';
  await init();
  vscode.postMessage({ type: 'ready' });
} catch (failure) { error.textContent = `Could not load the renderer: ${failure}`; }
