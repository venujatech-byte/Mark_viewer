const openButton = document.querySelector('#open');
const filename = document.querySelector('#filename');
const preview = document.querySelector('#preview');
const status = document.querySelector('#status');
let active = null;

async function openFile() {
  openButton.disabled = true;
  try {
    const opened = await window.__TAURI__.core.invoke('open_document');
    if (!opened) return;
    active = opened;
    filename.textContent = active.path.split(/[\\/]/).pop();
    filename.title = active.path;
    preview.innerHTML = active.html;
    status.textContent = '';
    document.title = `${filename.textContent} — Mark`;
  } catch (error) {
    status.textContent = `Could not open file: ${error}`;
  } finally {
    openButton.disabled = false;
  }
}

openButton.addEventListener('click', openFile);
