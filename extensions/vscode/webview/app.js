import init, { render, editorSource, applyEditorText } from './pkg/mdcore.js';

const vscode = acquireVsCodeApi();
const source = document.querySelector('#source');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const error = document.querySelector('#error');
const save = document.querySelector('#save');
let saveRequested = false;
const toggle = document.querySelector('#toggle');
let raw = '', version = 0, sequence = 0, pending = null, queued = false, blocked = false, loaded = false;
const images = new Map();
let imageSequence = 0;
source.readOnly = true;
document.querySelector('#open').disabled = false;
document.querySelector('#open').addEventListener('click', () => vscode.postMessage({ type: 'open' }));

function show(text) {
  images.clear();
  preview.innerHTML = render(text) || '<p class="empty-document">This file is empty.</p>';
  window.decorateMarkdown(preview);
  for (const image of preview.querySelectorAll('img')) {
    const url = image.getAttribute('src') || '';
    if (/^https?:/i.test(url)) continue;
    image.removeAttribute('src');
    const id = ++imageSequence;
    images.set(id, image);
    vscode.postMessage({ type: 'image', id, url });
  }
}

function sendEdit() {
  if (pending !== null || blocked || !loaded) return;
  const updated = applyEditorText(raw, source.value);
  if (updated === raw) { flushSave(); return; }
  pending = ++sequence;
  vscode.postMessage({ type: 'edit', id: pending, version, source: updated });
}

function flushSave() {
  if (saveRequested && pending === null && !blocked) {
    saveRequested = false;
    vscode.postMessage({ type: 'save' });
  }
}

save.addEventListener('click', () => {
  if (!loaded || blocked || source.readOnly) return;
  saveRequested = true;
  sendEdit();
});

window.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
    event.preventDefault(); save.click();
  }
});

window.addEventListener('message', event => {
  const message = event.data;
  if (message.type === 'toggle') { toggle.click(); return; }
  if (message.type === 'imageResult') {
    const image = images.get(message.id);
    images.delete(message.id);
    if (image?.isConnected && message.uri) image.src = message.uri;
    return;
  }
  if (message.type === 'saveResult') {
    if (!message.saved) error.textContent = message.error || 'Save was canceled or failed. Your edits remain in VS Code.';
    if (pending === null && !blocked) status.textContent = message.saved && !message.dirty ? 'Saved' : 'Unsaved changes';
    return;
  }
  if (message.type === 'editResult') {
    if (message.id !== pending) return;
    pending = null;
    if (!message.accepted) {
      blocked = true;
      source.readOnly = true;
      vscode.postMessage({ type: 'recover', source: applyEditorText(raw, source.value) });
      status.textContent = 'Unsent changes';
      error.textContent = message.error || 'The edit was rejected. Copy your source text before reopening.';
      return;
    }
    raw = message.source;
    version = message.version;
    status.textContent = message.dirty ? 'Unsaved changes' : 'Saved';
    if (queued) { queued = false; sendEdit(); }
    else flushSave();
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
  source.readOnly = Boolean(message.editingError);
  save.disabled = source.readOnly;
  error.textContent = message.editingError || '';
  show(raw);
  status.textContent = message.dirty ? 'Unsaved changes' : 'Saved';
  toggle.disabled = false;
  loaded = true;
});

preview.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  event.preventDefault();
  if (link.getAttribute('href')?.startsWith('#')) {
    preview.querySelector(link.getAttribute('href'))?.scrollIntoView();
    return;
  }
  vscode.postMessage({ type: 'link', url: link.getAttribute('href') });
});

source.addEventListener('input', () => {
  if (blocked || !loaded || source.readOnly) return;
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
