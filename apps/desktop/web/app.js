const openButton = document.querySelector('#open');
const filename = document.querySelector('#filename');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const errorBox = document.querySelector('#error');
const toggleButton = document.querySelector('#toggle');
const sourceInput = document.querySelector('#source');
const saveButton = document.querySelector('#save');
const editorText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
let saving = false;
let editing = false;
let active = null;
let opening = false;
let editQueue = Promise.resolve();
let savedEditor = '';
let revision = 0;

async function openFile() {
  if (opening) return;
  opening = true;
  document.querySelector('#welcome-open').disabled = true;
  openButton.disabled = true;
  status.textContent = 'Opening…';
  errorBox.textContent = '';
  try {
    const opened = await window.__TAURI__.core.invoke('open_document');
    if (!opened) return;
    active = opened;
    sourceInput.value = editorText(active.source);
    savedEditor = sourceInput.value;
    toggleButton.disabled = false;
    document.querySelector('#welcome').hidden = true;
    filename.textContent = active.path.split(/[\\/]/).pop();
    filename.title = active.path;
    preview.innerHTML = active.html;
    status.textContent = '';
    document.title = `${filename.textContent} — Mark`;
  } catch (error) {
    errorBox.textContent = `Could not open file: ${error}`;
  } finally {
    opening = false;
    document.querySelector('#welcome-open').disabled = false;
    openButton.disabled = false;
    status.textContent = active ? 'Read mode' : 'Open a markdown file to start reading.';
  }
}

openButton.addEventListener('click', openFile);

document.querySelector('#welcome-open').addEventListener('click', openFile);

function toggleMode() {
  if (!active) return;
  editing = !editing;
  document.querySelector('#source-pane').hidden = !editing;
  document.querySelector('#panes').classList.toggle('editing', editing);
  toggleButton.setAttribute('aria-pressed', String(editing));
  toggleButton.textContent = editing ? 'Read' : 'Edit';
  if (editing) sourceInput.focus();
}
toggleButton.addEventListener('click', toggleMode);

function isDirty() {
  return active !== null && sourceInput.value !== savedEditor;
}

sourceInput.addEventListener('input', () => {
  if (!active) return;
  const value = sourceInput.value;
  const current = ++revision;
  openButton.disabled = isDirty();
  refreshStatus();
  editQueue = editQueue.then(async () => {
    active.source = await window.__TAURI__.core.invoke('edit_source', { source: active.source, updated: value });
    if (current === revision) {
      preview.innerHTML = await window.__TAURI__.core.invoke('render_document', { source: active.source });
    }
  }).catch(error => {
    errorBox.textContent = `Could not update preview: ${error}`;
  });
  return editQueue;
});

function refreshStatus() {
  saveButton.disabled = !isDirty() || saving || opening;
  status.textContent = saving ? 'Saving…' : isDirty() ? 'Unsaved changes' : active ? 'Saved' : 'Open a markdown file to start reading.';
  document.title = active ? `${isDirty() ? '• ' : ''}${filename.textContent} — Mark` : 'Mark';
}

async function saveFile() {
  if (!active || saving || opening) return;
  saving = true;
  refreshStatus();
  errorBox.textContent = '';
  try {
    await editQueue;
    const source = active.source;
    if (editorText(source) !== sourceInput.value) throw new Error('Preview could not synchronize. Your text is still in the source pane.');
    await window.__TAURI__.core.invoke('save_document', { path: active.path, source });
    savedEditor = editorText(source);
    openButton.disabled = isDirty();
  } catch (error) {
    errorBox.textContent = `Could not save file: ${error}`;
  } finally {
    saving = false;
    refreshStatus();
  }
}
saveButton.addEventListener('click', saveFile);
