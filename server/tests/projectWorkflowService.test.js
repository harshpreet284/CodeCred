import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { analyzeRepository, getAnalysis } from '../src/services/projectWorkflowService.js';

let mongoServer;

test('Project Workflow Service', async (t) => {
  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  t.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  t.beforeEach(() => {
    global.fetch = t.mock.fn(async (url) => {
      if (url.includes('/git/trees/')) {
        return {
          ok: true,
          json: async () => ({
            tree: url.includes('test-limited') ? [{ path: 'big.txt', type: 'blob', size: 9999999 }] : [],
            truncated: url.includes('test-limited')
          })
        };
      } else if (url.includes('/contents/')) {
        return { ok: true, json: async () => ({ encoding: 'base64', content: Buffer.from('test').toString('base64') }) };
      } else {
        const parts = url.split('/');
        const repoName = parts[parts.length - 1];
        return {
          ok: true,
          json: async () => ({
            owner: { login: 'test-owner' },
            name: repoName,
            full_name: `test-owner/${repoName}`,
            default_branch: 'main'
          })
        };
      }
    });
  });

  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test('should orchestrate successfully and return safe DTO', async (t) => {
    const result = await analyzeRepository('https://github.com/test-owner/test-repo');

    assert.ok(result.analysisId);
    assert.strictEqual(typeof result.analysisId, 'string');
    assert.strictEqual(result.repository.owner, 'test-owner');
    assert.strictEqual(result.repository.name, 'test-repo');
    assert.ok(result.analysis);
    assert.ok(result.analysis.dependencies);
    assert.ok(result.createdAt);
    assert.ok(result.updatedAt);
    
    // Ensure no Mongoose internals or raw files leak
    assert.strictEqual(result.__v, undefined);
    assert.strictEqual(result._id, undefined);
    assert.strictEqual(result.analysis.files, undefined); 
  });

  await t.test('should bubble up AppError on invalid URL without swallowing', async (t) => {
    await assert.rejects(
      async () => await analyzeRepository('invalid-url'),
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'INVALID_GITHUB_URL');
        return true;
      }
    );
  });

  await t.test('should bubble up AppError on Github 404 (Repo missing)', async (t) => {
    global.fetch.mock.mockImplementationOnce(async () => ({ ok: false, status: 404 }));

    await assert.rejects(
      async () => await analyzeRepository('https://github.com/test/missing'),
      (err) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'REPO_NOT_FOUND');
        return true;
      }
    );
  });

  await t.test('should bubble up AppError on Github Rate Limit (429)', async (t) => {
    global.fetch.mock.mockImplementationOnce(async () => ({ ok: false, status: 429, headers: new Headers({'x-ratelimit-remaining': '0'}) }));

    await assert.rejects(
      async () => await analyzeRepository('https://github.com/test/ratelimited'),
      (err) => {
        assert.strictEqual(err.statusCode, 429);
        assert.strictEqual(err.code, 'RATE_LIMIT_EXCEEDED');
        return true;
      }
    );
  });

  await t.test('retrieval limitations should still allow analysis and persistence', async (t) => {
    const result = await analyzeRepository('https://github.com/test-owner/test-limited');
    
    assert.ok(result.analysisId);
    assert.strictEqual(result.analysis.analysisMetadata.limitations.length > 0, true);
    assert.ok(result.analysis.analysisMetadata.limitations.some(msg => msg.includes('truncated')));
  });

  await t.test('duplicate repository submissions should result in distinct snapshot IDs', async (t) => {
    const result1 = await analyzeRepository('https://github.com/test-owner/test-dup');
    const result2 = await analyzeRepository('https://github.com/test-owner/test-dup');
    assert.notStrictEqual(result1.analysisId, result2.analysisId);
  });

  await t.test('getAnalysis should retrieve safe DTO by ID', async (t) => {
    const saved = await analyzeRepository('https://github.com/test-owner/test-repo');
    const retrieved = await getAnalysis(saved.analysisId);
    
    assert.strictEqual(retrieved.analysisId, saved.analysisId);
    assert.strictEqual(retrieved.repository.owner, 'test-owner');
    assert.strictEqual(retrieved.__v, undefined);
    assert.strictEqual(retrieved._id, undefined);
    assert.strictEqual(retrieved.analysis.files, undefined);
  });

  await t.test('getAnalysis should throw 404 for non-existent ID', async (t) => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await assert.rejects(
      async () => await getAnalysis(fakeId),
      (err) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'ANALYSIS_NOT_FOUND');
        return true;
      }
    );
  });

  await t.test('should bubble up persistence failure', async (t) => {
    // Force persistence failure by disconnecting mongoose
    await mongoose.disconnect();

    await assert.rejects(
      async () => await analyzeRepository('https://github.com/test-owner/test-repo'),
      (err) => {
        assert.strictEqual(err.statusCode, 500);
        assert.strictEqual(err.code, 'PERSISTENCE_ERROR');
        return true;
      }
    );
    
    // Reconnect for any subsequent tests
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });
});
