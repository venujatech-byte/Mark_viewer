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


test('webview policy permits WASM while denying inline scripts and host navigation', () => {
  const { webviewCsp } = require('../dist/html');
  const csp = webviewCsp('https://resources.example', 'abc123');
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src 'nonce-abc123' 'wasm-unsafe-eval';/);
  for (const directive of ['base-uri', 'object-src', 'frame-src', 'form-action']) assert.ok(csp.includes(`${directive} 'none'`));
  assert.ok(!csp.includes("'unsafe-inline'"));
  assert.ok(!csp.includes("'unsafe-eval'"));
  assert.ok(!csp.includes('command:'));
});
