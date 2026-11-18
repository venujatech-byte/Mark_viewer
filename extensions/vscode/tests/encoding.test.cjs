const { test } = require('node:test');
const assert = require('node:assert/strict');
const { editingError } = require('../dist/encoding');

test('native UTF-8 BOM and uniform newline conventions are safe without reinserting a BOM', () => {
  for (const eol of ['\n', '\r\n']) {
    const text = `---${eol}# comment${eol}---${eol}සිංහල  `;
    assert.equal(editingError(Buffer.from(`\uFEFF${text}`), text, false), undefined);
    assert.equal(editingError(Buffer.from(text), `${text}!`, true), undefined);
  }
});

test('mixed newlines CR-only invalid encodings and mismatched buffers are read-only', () => {
  for (const text of ['a\nb\r\nc', 'a\rb', 'a\rb\nc']) assert.match(editingError(Buffer.from(text), text, false), /newlines/);
  assert.match(editingError(Uint8Array.of(0xff, 0xfe), '', false), /UTF-8/);
  assert.match(editingError(Buffer.from('one'), 'two', false), /differs/);
});
