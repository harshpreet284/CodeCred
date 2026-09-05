import test from 'node:test';
import assert from 'node:assert';
import { parseGitHubUrl } from '../src/utils/githubParser.js';

test('parseGitHubUrl should correctly parse standard repository URLs', () => {
  const result = parseGitHubUrl('https://github.com/facebook/react');
  assert.deepStrictEqual(result, { owner: 'facebook', repo: 'react' });
});

test('parseGitHubUrl should handle trailing slashes', () => {
  const result = parseGitHubUrl('https://github.com/facebook/react/');
  assert.deepStrictEqual(result, { owner: 'facebook', repo: 'react' });
});

test('parseGitHubUrl should handle www prefix', () => {
  const result = parseGitHubUrl('https://www.github.com/facebook/react');
  assert.deepStrictEqual(result, { owner: 'facebook', repo: 'react' });
});

test('parseGitHubUrl should handle .git suffix', () => {
  const result = parseGitHubUrl('https://github.com/facebook/react.git');
  assert.deepStrictEqual(result, { owner: 'facebook', repo: 'react' });
});

test('parseGitHubUrl should throw on non-github URLs', () => {
  assert.throws(
    () => parseGitHubUrl('https://gitlab.com/facebook/react'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on missing repository', () => {
  assert.throws(
    () => parseGitHubUrl('https://github.com/facebook'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on arbitrary GitHub pages (issues, pulls, etc.)', () => {
  assert.throws(
    () => parseGitHubUrl('https://github.com/facebook/react/issues/123'),
    { code: 'INVALID_GITHUB_URL' }
  );
  assert.throws(
    () => parseGitHubUrl('https://github.com/facebook/react/tree/main/src'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on http protocol', () => {
  assert.throws(
    () => parseGitHubUrl('http://github.com/owner/repo'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on non-standard ports', () => {
  assert.throws(
    () => parseGitHubUrl('https://github.com:8080/owner/repo'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw if repository name is just .git', () => {
  assert.throws(
    () => parseGitHubUrl('https://github.com/owner/.git'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on query strings', () => {
  assert.throws(
    () => parseGitHubUrl('https://github.com/owner/repo?v=1'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on fragments', () => {
  assert.throws(
    () => parseGitHubUrl('https://github.com/owner/repo#readme'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on encoded/path-manipulation input', () => {
  assert.throws(
    () => parseGitHubUrl('https://github.com/owner/repo%2Fbad'),
    { code: 'INVALID_GITHUB_URL' }
  );
  assert.throws(
    () => parseGitHubUrl('https://github.com/owner/..'),
    { code: 'INVALID_GITHUB_URL' }
  );
});

test('parseGitHubUrl should throw on malformed inputs', () => {
  assert.throws(
    () => parseGitHubUrl('not-a-url'),
    { code: 'INVALID_GITHUB_URL' }
  );
  assert.throws(
    () => parseGitHubUrl(null),
    { code: 'INVALID_GITHUB_URL' }
  );
});
