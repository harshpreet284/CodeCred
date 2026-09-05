import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { analyzeProject } from '../src/controllers/projectController.js';

let mongoServer;

test('Project Controller', async (t) => {
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
            tree: [],
            truncated: false
          })
        };
      } else if (url.includes('/contents/')) {
        return { ok: true, json: async () => ({ encoding: 'base64', content: Buffer.from('test').toString('base64') }) };
      } else {
        return {
          ok: true,
          json: async () => ({
            owner: { login: 'owner' },
            name: 'repo',
            full_name: 'owner/repo',
            default_branch: 'main'
          })
        };
      }
    });
  });

  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test('analyzeProject should return 201 with success response on valid request', async (t) => {
    const req = {
      body: { repositoryUrl: 'https://github.com/owner/repo' }
    };

    let statusCalledWith = null;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status: (code) => {
        statusCalledWith = code;
        return res;
      },
      json: (data) => {
        jsonCalledWith = data;
        return res;
      }
    };
    
    const next = (err) => {
      nextCalled = true;
    };

    await analyzeProject(req, res, next);

    assert.strictEqual(statusCalledWith, 201);
    assert.ok(jsonCalledWith.success);
    assert.ok(jsonCalledWith.data.analysisId);
    assert.strictEqual(jsonCalledWith.message, 'Analysis completed successfully');
    assert.strictEqual(nextCalled, false);
  });

  await t.test('analyzeProject should call next(error) on missing url', async (t) => {
    const req = { body: {} };
    const res = {};
    let passedError = null;
    const next = (err) => {
      passedError = err;
    };

    await analyzeProject(req, res, next);

    assert.ok(passedError);
    assert.strictEqual(passedError.statusCode, 400);
    assert.strictEqual(passedError.code, 'INVALID_INPUT');
  });

  await t.test('analyzeProject should call next(error) when workflow throws', async (t) => {
    global.fetch.mock.mockImplementationOnce(async () => {
      return {
        ok: false,
        status: 429,
        headers: new Headers({'x-ratelimit-remaining': '0'})
      };
    });

    const req = { body: { repositoryUrl: 'https://github.com/owner/repo' } };
    const res = {};
    let passedError = null;
    const next = (err) => {
      passedError = err;
    };

    await analyzeProject(req, res, next);

    assert.ok(passedError);
    assert.strictEqual(passedError.statusCode, 429);
    assert.strictEqual(passedError.code, 'RATE_LIMIT_EXCEEDED');
  });
});
