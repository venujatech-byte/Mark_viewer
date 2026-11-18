const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function reader(invoke) {
  const elements = new Map();
  const document = {
    title: 'Mark',
    addEventListener(name, callback) { this[name] = callback; },
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        textContent: '', innerHTML: '', disabled: false,
        classList: { toggle() {} }, setAttribute() {}, focus() {},
        addEventListener(name, callback) { this[name] = callback; },
      });
      return elements.get(selector);
    },
  };
  let closeHandler;
  let destroyed = false;
  vm.runInNewContext(readFileSync(`${__dirname}/../web/app.js`, 'utf8'), {
    document, window: { __TAURI__: { core: { invoke }, window: { getCurrentWindow: () => ({
      onCloseRequested(handler) { closeHandler = handler; return Promise.resolve(); },
      async destroy() { destroyed = true; },
    }) } } },
  });
  return { document, elements, open: () => elements.get('#open').click(),
    close: event => closeHandler(event), destroyed: () => destroyed };
}

test('opening renders a document and cancellation preserves it', async () => {
  const results = [{ path: '/notes/AGENTS.md', source: '# Instructions', html: '<h1>Instructions</h1>' }, null];
  const app = reader(async () => results.shift());
  await app.open();
  assert.equal(app.elements.get('#preview').innerHTML, '<h1>Instructions</h1>');
  assert.equal(app.document.title, 'AGENTS.md — Mark');
  await app.open();
  assert.equal(app.elements.get('#preview').innerHTML, '<h1>Instructions</h1>');
  assert.equal(app.elements.get('#open').disabled, false);
});

test('a failed open preserves the active document and permits retry', async () => {
  let fail = false;
  const app = reader(async () => {
    if (fail) throw new Error('Permission denied');
    return { path: '/notes/README.md', source: '# Keep', html: '<h1>Keep</h1>' };
  });
  await app.open();
  fail = true;
  await app.open();
  assert.equal(app.elements.get('#preview').innerHTML, '<h1>Keep</h1>');
  assert.match(app.elements.get('#error').textContent, /Permission denied/);
  assert.equal(app.elements.get('#open').disabled, false);
  fail = false;
  await app.open();
  assert.equal(app.elements.get('#error').textContent, '');
});

test('only one native picker may be opened at a time', async () => {
  let resolve;
  let calls = 0;
  const app = reader(() => { calls++; return new Promise(done => { resolve = done; }); });
  const pending = app.open();
  await app.open();
  assert.equal(calls, 1);
  resolve(null);
  await pending;
  assert.equal(app.elements.get('#welcome-open').disabled, false);
});

test('the source toggle reveals source without changing rendered content', async () => {
  const app = reader(async () => ({ path: '/notes/a.md', source: '\uFEFF# Heading\r\n', html: '<h1>Heading</h1>' }));
  await app.open();
  app.elements.get('#toggle').click();
  assert.equal(app.elements.get('#source-pane').hidden, false);
  assert.equal(app.elements.get('#source').value, '# Heading\n');
  assert.equal(app.elements.get('#preview').innerHTML, '<h1>Heading</h1>');
  app.elements.get('#toggle').click();
  assert.equal(app.elements.get('#source-pane').hidden, true);
});

test('typing updates the rendered preview and retains dirty text', async () => {
  const app = reader(async (command, data) => {
    if (command === 'open_document') return { path: '/a.md', source: '# Old', html: '<h1>Old</h1>' };
    if (command === 'edit_source') return data.updated;
    if (command === 'render_document') return `<h1>${data.source.slice(2)}</h1>`;
    throw new Error(command);
  });
  await app.open();
  app.elements.get('#source').value = '# New';
  await app.elements.get('#source').input();
  assert.equal(app.elements.get('#preview').innerHTML, '<h1>New</h1>');
  assert.equal(app.elements.get('#status').textContent, 'Unsaved changes');
});

test('saving sends edited source and clears the dirty state', async () => {
  let saved;
  const app = reader(async (command, data) => {
    if (command === 'open_document') return { path: '/a.md', source: '# Old', html: '<h1>Old</h1>' };
    if (command === 'edit_source') return data.updated;
    if (command === 'render_document') return '<h1>New</h1>';
    if (command === 'save_document') { saved = data; return; }
    throw new Error(command);
  });
  await app.open();
  app.elements.get('#source').value = '# New';
  await app.elements.get('#source').input();
  await app.elements.get('#save').click();
  assert.equal(saved.path, '/a.md');
  assert.equal(saved.source, '# New');
  assert.equal(app.elements.get('#status').textContent, 'Saved');
  assert.equal(app.elements.get('#save').disabled, true);
});

test('edits made during a pending save remain dirty after the saved snapshot returns', async () => {
  let finishSave;
  let requested;
  const app = reader(async (command, data) => {
    if (command === 'open_document') return { path: '/a.md', source: '# Old', html: '<h1>Old</h1>' };
    if (command === 'edit_source') return data.updated;
    if (command === 'render_document') return data.source;
    if (command === 'save_document') {
      requested = data.source;
      return new Promise(done => { finishSave = done; });
    }
    throw new Error(command);
  });
  await app.open();
  app.elements.get('#source').value = '# First';
  await app.elements.get('#source').input();
  const pending = app.elements.get('#save').click();
  await new Promise(setImmediate);
  app.elements.get('#source').value = '# Second';
  await app.elements.get('#source').input();
  finishSave();
  await pending;
  assert.equal(requested, '# First');
  assert.equal(app.elements.get('#source').value, '# Second');
  assert.equal(app.elements.get('#status').textContent, 'Unsaved changes');
  assert.equal(app.elements.get('#save').disabled, false);
});

test('declining discard keeps the unsaved document and avoids another picker', async () => {
  let picks = 0;
  const app = reader(async (command, data) => {
    if (command === 'open_document') { picks++; return { path: '/a.md', source: 'Old', html: '<p>Old</p>' }; }
    if (command === 'edit_source') return data.updated;
    if (command === 'render_document') return data.source;
    if (command === 'confirm_discard') return false;
    throw new Error(command);
  });
  await app.open();
  app.elements.get('#source').value = 'Keep these changes';
  await app.elements.get('#source').input();
  await app.open();
  assert.equal(picks, 1);
  assert.equal(app.elements.get('#source').value, 'Keep these changes');
  assert.equal(app.elements.get('#source').readOnly, false);
  assert.equal(app.elements.get('#status').textContent, 'Unsaved changes');
});

test('declining a native close keeps unsaved text and the window', async () => {
  const app = reader(async (command, data) => {
    if (command === 'open_document') return { path: '/a.md', source: 'Old', html: '<p>Old</p>' };
    if (command === 'edit_source') return data.updated;
    if (command === 'render_document') return data.source;
    if (command === 'confirm_discard') return false;
    throw new Error(command);
  });
  await app.open();
  app.elements.get('#source').value = 'Unsaved';
  await app.elements.get('#source').input();
  let prevented = false;
  await app.close({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(app.destroyed(), false);
  assert.equal(app.elements.get('#source').value, 'Unsaved');
});

test('keyboard open and edit shortcuts prevent browser defaults', async () => {
  const app = reader(async () => ({ path: '/a.md', source: 'A', html: '<p>A</p>' }));
  let prevented = 0;
  await app.document.keydown({ key: 'O', ctrlKey: true, preventDefault() { prevented++; } });
  app.document.keydown({ key: 'e', metaKey: true, preventDefault() { prevented++; } });
  assert.equal(prevented, 2);
  assert.equal(app.elements.get('#source-pane').hidden, false);
  app.document.keydown({ key: 'e', ctrlKey: false, metaKey: false, preventDefault() { throw new Error('ordinary typing must work'); } });
});
