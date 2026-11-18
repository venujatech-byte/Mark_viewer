const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { imagePath, relativeUrl, linkUrl } = require('../dist/resources');

test('local image scope rejects traversal symlinks oversized files and unsafe URLs', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'mark-images-'));
  try {
    const folder = path.join(temp, 'notes');
    await fs.mkdir(folder);
    const document = path.join(folder, 'a.md');
    const image = path.join(folder, 'a b.png');
    await fs.writeFile(image, 'image');
    assert.equal(await imagePath(document, 'a%20b.png'), image);
    await fs.writeFile(path.join(temp, 'outside.png'), 'outside');
    await fs.symlink(path.join(temp, 'outside.png'), path.join(folder, 'escape.png'));
    for (const url of ['../outside.png', 'escape.png', 'file:///etc/passwd', '//host/a.png', 'command:run', 'data:text/plain,a', 'bad\\path']) await assert.rejects(imagePath(document, url));
    const large = await fs.open(path.join(folder, 'large.png'), 'w');
    await large.truncate(10 * 1024 * 1024 + 1); await large.close();
    await assert.rejects(imagePath(document, 'large.png'), /10 MiB/);
    assert.equal(relativeUrl(document, '../other.md#heading').hash, '#heading');
    assert.equal((await linkUrl(document, 'https://example.test')).protocol, 'https:');
    for (const url of ['javascript:alert(1)', 'data:text/html,x', '//host/path']) await assert.rejects(linkUrl(document, url));
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
