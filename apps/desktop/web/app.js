const openButton = document.querySelector('#open');
const filename = document.querySelector('#filename');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
const errorBox = document.querySelector('#error');
const toggleButton = document.querySelector('#toggle');
const sourceInput = document.querySelector('#source');
let editing = false;
let active = null;
let opening = false;

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
    sourceInput.value = active.source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
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
  toggleButton.textContent = editing ? 'Read' : 'Source';
  if (editing) sourceInput.focus();
}
toggleButton.addEventListener('click', toggleMode);
