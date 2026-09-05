import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { saveAnalysis, getAnalysisById } from '../src/services/projectAnalysisService.js';
import { ProjectAnalysis } from '../src/models/ProjectAnalysis.js';

let mongoServer;

describe('ProjectAnalysis Service', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Realistic normalized Task 6 analysis fixture
  const realisticFixture = {
    repository: {
      owner: 'expressjs',
      name: 'express',
      fullName: 'expressjs/express',
      defaultBranch: 'master'
    },
    summary: {
      languages: [
        {
          type: 'repository_metadata',
          source: { path: 'github_api', field: 'language' },
          detail: 'Detected primary language JavaScript from GitHub metadata'
        }
      ],
      frameworks: [],
      libraries: []
    },
    structure: {
      directories: [],
      importantFiles: [],
      entryPoints: []
    },
    dependencies: {
      manifests: [],
      packages: []
    },
    api: { indicators: [] },
    database: { indicators: [] },
    authentication: { indicators: [] },
    testing: { indicators: [] },
    documentation: { indicators: [] },
    deployment: { indicators: [] },
    analysisMetadata: {
      analysisVersion: '1.0.0',
      limitations: ['Tree truncated: structural evidence may be incomplete.']
    }
  };

  it('should successfully perform a full save -> getById round-trip without loss or mutation', async () => {
    // Save
    const saved = await saveAnalysis(realisticFixture);
    assert.ok(saved._id);
    assert.strictEqual(saved.repository.fullName, 'expressjs/express');
    assert.ok(saved.createdAt);
    assert.ok(saved.updatedAt);
    
    // Retrieve
    const retrieved = await getAnalysisById(saved._id.toString());
    assert.ok(retrieved);
    
    // Verify repository identity
    assert.strictEqual(retrieved.repository.owner, 'expressjs');
    assert.strictEqual(retrieved.repository.name, 'express');
    assert.strictEqual(retrieved.repository.fullName, 'expressjs/express');
    assert.strictEqual(retrieved.repository.defaultBranch, 'master');

    // Verify evidence arrays and categories
    assert.strictEqual(retrieved.summary.languages.length, 1);
    assert.strictEqual(retrieved.summary.languages[0].type, 'repository_metadata');
    assert.strictEqual(retrieved.summary.languages[0].source.path, 'github_api');
    assert.strictEqual(retrieved.summary.languages[0].source.field, 'language');
    assert.strictEqual(retrieved.summary.languages[0].detail, 'Detected primary language JavaScript from GitHub metadata');

    // Verify metadata and limitations
    assert.strictEqual(retrieved.analysisMetadata.analysisVersion, '1.0.0');
    assert.strictEqual(retrieved.analysisMetadata.limitations.length, 1);
    assert.strictEqual(retrieved.analysisMetadata.limitations[0], 'Tree truncated: structural evidence may be incomplete.');
  });

  it('should fail schema validation on malformed payload', async () => {
    const invalidPayload = {
      repository: { owner: 'expressjs' } // Missing name, fullName, defaultBranch
    };
    
    try {
      await saveAnalysis(invalidPayload);
      assert.fail('Should have thrown validation error');
    } catch (err) {
      assert.strictEqual(err.code, 'VALIDATION_ERROR');
      assert.ok(err.message.includes('Analysis Validation Failed'));
    }
  });

  it('should allow multiple analyses for the same repository to coexist with distinct IDs', async () => {
    const saved1 = await saveAnalysis(realisticFixture);
    const saved2 = await saveAnalysis(realisticFixture);
    
    assert.notStrictEqual(saved1._id.toString(), saved2._id.toString());
    
    const count = await ProjectAnalysis.countDocuments({ 'repository.fullName': 'expressjs/express' });
    assert.ok(count >= 2);
  });

  it('should handle getAnalysisById for a missing ID properly', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    try {
      await getAnalysisById(fakeId.toString());
      assert.fail('Should have thrown not found error');
    } catch (err) {
      assert.strictEqual(err.code, 'ANALYSIS_NOT_FOUND');
    }
  });
  
  it('should handle getAnalysisById with an invalid format ID', async () => {
    try {
      await getAnalysisById('not-an-object-id');
      assert.fail('Should have thrown invalid id format error');
    } catch (err) {
      assert.strictEqual(err.code, 'INVALID_ID_FORMAT');
    }
  });
});
