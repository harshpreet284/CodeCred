import test from 'node:test';
import assert from 'node:assert';
import { selectRelevantFiles } from '../src/services/fileSelectionService.js';

test('selectRelevantFiles should exclude binaries and excluded dirs', () => {
  const tree = [
    { path: 'node_modules/express/package.json', type: 'blob', size: 100 },
    { path: 'dist/app.js', type: 'blob', size: 100 },
    { path: 'src/logo.png', type: 'blob', size: 100 },
    { path: 'src/index.js', type: 'blob', size: 100 },
    { path: 'package.json', type: 'blob', size: 100 }
  ];
  
  const result = selectRelevantFiles(tree, 50);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].path, 'package.json'); // priority 1
  assert.strictEqual(result[1].path, 'src/index.js'); // priority 3
});

test('selectRelevantFiles should respect maxFilesToFetch limit deterministically', () => {
  const tree = [
    { path: 'src/a.js', type: 'blob', size: 10 },
    { path: 'src/b.js', type: 'blob', size: 10 },
    { path: 'src/c.js', type: 'blob', size: 10 },
    { path: 'package.json', type: 'blob', size: 10 },
    { path: 'tsconfig.json', type: 'blob', size: 10 }
  ];
  
  const result = selectRelevantFiles(tree, 3);
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].path, 'package.json'); // priority 1
  assert.strictEqual(result[1].path, 'tsconfig.json'); // priority 2
});

test('selectRelevantFiles should prefer shallower source files over deep ones', () => {
  const tree = [
    { path: 'src/components/deep/deep/nested.js', type: 'blob', size: 10 },
    { path: 'index.js', type: 'blob', size: 10 }
  ];
  
  const result = selectRelevantFiles(tree, 50);
  assert.strictEqual(result[0].path, 'index.js');
  assert.strictEqual(result[1].path, 'src/components/deep/deep/nested.js');
});
