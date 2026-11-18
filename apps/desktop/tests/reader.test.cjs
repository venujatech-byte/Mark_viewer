const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function reader(invoke) {
  const elements = new Map();
  const document = {
    title: 'Mark',
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        textContent: '', innerHTML: '', disabled: false,
        addEventListener(name, callback) { this[name] = callback; },
      });
      return elements.get(selector);
    },
  };
  vm.runInNewContext(readFileSync(`${__dirname}/../web/app.js`, 'utf8'), {
    document, window: { __TAURI__: { core: { invoke } } },
  });
  return { document, elements, open: () => elements.get('#open').click() };
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
