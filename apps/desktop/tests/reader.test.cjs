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
