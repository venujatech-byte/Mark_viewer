const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { webviewHtml } = require('../dist/html');

test('webview HTML uses a CSP and nonces on every packaged script', () => {
  const template = readFileSync(`${__dirname}/../../../apps/desktop/web/index.html`, 'utf8');
  const html = webviewHtml(template, "default-src 'none'", 'test-nonce', name => `https://resource.test/${name}`);
  assert.ok(html.includes('Content-Security-Policy'));
  assert.equal((html.match(/<script /g) || []).length, 3);
  assert.equal((html.match(/nonce="test-nonce"/g) || []).length, 3);
  assert.ok(html.includes('src="https://resource.test/webview.js"'));
  assert.ok(html.includes('href="https://resource.test/style.css"'));
  assert.ok(!html.includes('src="app.js"'));
});
