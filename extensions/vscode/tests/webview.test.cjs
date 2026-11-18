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
