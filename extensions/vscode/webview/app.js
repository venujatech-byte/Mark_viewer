import init, { render, editorSource } from './pkg/mdcore.js';

const vscode = acquireVsCodeApi();
const source = document.querySelector('#source');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const error = document.querySelector('#error');
const toggle = document.querySelector('#toggle');
source.readOnly = true;
document.querySelector('#open').disabled = true;

window.addEventListener('message', event => {
  const message = event.data;
  if (message.type !== 'document') return;
  document.querySelector('#welcome').hidden = true;
  document.querySelector('#filename').textContent = message.path.split(/[\\/]/).pop();
  source.value = editorSource(message.source);
  source.setSelectionRange(0, 0);
  preview.innerHTML = render(message.source) || '<p class="empty-document">This file is empty.</p>';
  window.decorateMarkdown(preview);
  status.textContent = message.dirty ? 'Unsaved changes' : 'Saved';
  toggle.disabled = false;
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
} catch (failure) {
  error.textContent = `Could not load the renderer: ${failure}`;
}
