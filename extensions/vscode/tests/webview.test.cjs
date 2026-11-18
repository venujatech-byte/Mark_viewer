const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

async function webview() {
  const elements = new Map(), messages = [];
  const document = { querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', selectionStart: 0, selectionEnd: 0,
      setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
      classList: { toggle() {} }, setAttribute() {}, focus() {},
      addEventListener(name, callback) { this[name] = callback; },
    });
    return elements.get(selector);
  } };
  let receive;
  const script = readFileSync(`${__dirname}/../webview/app.js`, 'utf8').replace(/^import .*\n/, '');
  await vm.runInNewContext(`(async () => {${script}\n})()`, {
    document, acquireVsCodeApi: () => ({ postMessage: message => messages.push(message) }),
    window: { decorateMarkdown() {}, addEventListener(name, handler) { if (name === 'message') receive = handler; } },
    init: async () => {}, render: text => `<p>${text}</p>`,
    editorSource: text => text.replace(/\r\n/g, '\n'), applyEditorText: (_, text) => text,
  });
  return { elements, messages, receive: data => receive({ data }) };
}

const snapshot = (source, version, dirty = false) => ({ type: 'document', source, version, dirty, path: '/notes/a.md' });

test('external changes and undo snapshots refresh the rendered and source views', async () => {
  const app = await webview();
  app.receive(snapshot('First', 1));
  app.elements.get('#source').setSelectionRange(2, 4);
  app.receive(snapshot('External', 2));
  assert.equal(app.elements.get('#preview').innerHTML, '<p>External</p>');
  assert.equal(app.elements.get('#source').value, 'External');
  assert.equal(app.elements.get('#source').selectionStart, 2);
  let prevented = false;
  app.elements.get('#source').keydown({ key: 'z', ctrlKey: true, preventDefault() { prevented = true; } });
  assert.ok(prevented);
  assert.equal(app.messages.at(-1).type, 'undo');
  app.receive(snapshot('First', 3));
  assert.equal(app.elements.get('#source').value, 'First');
});


test('rejected edits retain the latest queued input in a recovery document', async () => {
  const app = await webview();
  app.receive(snapshot('Original', 1));
  const source = app.elements.get('#source');
  source.value = 'First input'; source.input();
  const request = app.messages.at(-1);
  source.value = 'Latest unsent input'; source.input();
  app.receive({ ...snapshot('External', 2), type: 'editResult', id: request.id, accepted: false });
  assert.equal(source.value, 'Latest unsent input');
  assert.equal(source.readOnly, true);
  assert.equal(app.messages.at(-1).type, 'recover');
  assert.equal(app.messages.at(-1).source, 'Latest unsent input');
  app.receive(snapshot('External', 3));
  assert.equal(source.value, 'Latest unsent input');
});

test('typing while an edit is pending serializes the latest input after acknowledgment', async () => {
  const app = await webview();
  app.receive(snapshot('Original', 1));
  const source = app.elements.get('#source');
  source.value = 'First'; source.input();
  const request = app.messages.at(-1);
  source.value = 'Second'; source.input();
  app.receive({ ...snapshot('First', 2, true), type: 'editResult', id: request.id, accepted: true });
  assert.equal(app.messages.at(-1).source, 'Second');
  assert.equal(app.messages.at(-1).version, 2);
});


test('save waits for the latest queued edit and failed saves keep the source', async () => {
  const app = await webview();
  app.receive(snapshot('Original', 1));
  const source = app.elements.get('#source');
  source.value = 'First'; source.input();
  const first = app.messages.at(-1);
  source.value = 'Second'; source.input();
  app.elements.get('#save').click();
  assert.equal(app.messages.at(-1).type, 'edit');
  app.receive({ ...snapshot('First', 2, true), type: 'editResult', id: first.id, accepted: true });
  const second = app.messages.at(-1);
  assert.equal(second.source, 'Second');
  app.receive({ ...snapshot('Second', 3, true), type: 'editResult', id: second.id, accepted: true });
  assert.equal(app.messages.at(-1).type, 'save');
  app.receive({ type: 'saveResult', saved: false, error: 'Disk conflict' });
  assert.equal(source.value, 'Second');
  assert.equal(app.elements.get('#error').textContent, 'Disk conflict');
});
