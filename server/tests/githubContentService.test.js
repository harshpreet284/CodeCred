import test from 'node:test';
import assert from 'node:assert';
import { getRepositoryTree, fetchFileContent } from '../src/services/githubContentService.js';

test('getRepositoryTree normalizes tree and detects truncation', async () => {
  const originalFetch = global.fetch;
  
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      sha: 'test',
      url: 'url',
      tree: [
        { path: 'src', type: 'tree' },
        { path: 'src/index.js', type: 'blob', size: 123 }
      ],
      truncated: true
    })
  });

  try {
    const tree = await getRepositoryTree('owner', 'repo', 'main');
    assert.strictEqual(tree.truncated, true);
    assert.strictEqual(tree.directories.length, 1);
    assert.strictEqual(tree.directories[0], 'src');
    assert.strictEqual(tree.files.length, 1);
    assert.strictEqual(tree.files[0].path, 'src/index.js');
    assert.strictEqual(tree.files[0].size, 123);
  } finally {
    global.fetch = originalFetch;
  }
});

test('fetchFileContent decodes base64 content correctly', async () => {
  const originalFetch = global.fetch;
  
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      encoding: 'base64',
      content: Buffer.from('hello world').toString('base64')
    })
  });

  try {
    const content = await fetchFileContent('owner', 'repo', 'src/index.js', 'main');
    assert.strictEqual(content, 'hello world');
  } finally {
    global.fetch = originalFetch;
  }
});
