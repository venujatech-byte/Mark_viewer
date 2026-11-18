import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import init, { render } from '../pkg/mdcore.js';

const binary = readFileSync(new URL('../pkg/mdcore_bg.wasm', import.meta.url));
await init({ module_or_path: binary });

test('browser WASM renders the same bytes as native mdcore for every fixture', () => {
  for (const name of ['AGENTS.md', 'SKILL.md', 'README.md', 'FEATURES.md']) {
    const path = fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));
    const native = spawnSync('cargo', ['run', '--quiet', '--offline', '-p', 'mdcore', '--example', 'render', '--', path], { encoding: 'utf8' });
    assert.equal(native.status, 0, native.stderr);
    assert.equal(render(readFileSync(path, 'utf8')), native.stdout, name);
  }
});

test('the browser module has no WASI filesystem imports', () => {
  const imports = WebAssembly.Module.imports(new WebAssembly.Module(binary));
  assert.ok(imports.every(item => !item.module.includes('wasi')));
});
