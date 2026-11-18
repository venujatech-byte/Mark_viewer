const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
const context = vm.createContext({});
vm.runInContext(readFileSync(`${__dirname}/../web/vendor/highlight.min.js`, 'utf8'), context);

test('bundled highlighter supports Rust and escapes source HTML', () => {
  assert.ok(context.hljs.getLanguage('rust'));
  assert.equal(context.hljs.getLanguage('not-a-language'), undefined);
  const html = context.hljs.highlight('fn main() { "<script>"; }', { language: 'rust' }).value;
  assert.ok(html.includes('hljs-keyword'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});
