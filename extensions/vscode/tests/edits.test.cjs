const { test } = require('node:test');
const assert = require('node:assert/strict');
const { minimalEdit, isEditRequest } = require('../dist/edits');

test('minimal edits use UTF-16 positions without splitting Unicode characters', () => {
  assert.deepEqual(minimalEdit('a🦀z', 'a界z'), { start: 1, end: 3, text: '界' });
  for (const before of ['', 'é', '🦀\r\n', '# සිංහල  ']) {
    for (const after of ['', '日本語', '🦁\r\n', '# සිංහල  ']) {
      const edit = minimalEdit(before, after);
      assert.equal(edit ? before.slice(0, edit.start) + edit.text + before.slice(edit.end) : before, after);
    }
  }
});

test('edit messages validate their version source and identifier', () => {
  assert.ok(isEditRequest({ type: 'edit', id: 1, version: 2, source: '# Text' }));
  for (const value of [null, {}, { type: 'edit', id: 1, version: 2, source: 42 }, { type: 'edit', id: -1, version: 2, source: '' }]) assert.equal(isEditRequest(value), false);
});
