import test, { describe } from 'node:test';
import assert from 'node:assert';
import { buildAIContext } from '../src/services/ai/contextBuilder.js';

describe('AI Context Builder', () => {

  const createMockAnalysis = () => ({
    _id: '64e8b3f2',
    __v: 0,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    repository: {
      owner: 'testowner',
      name: 'testrepo',
      fullName: 'testowner/testrepo',
      defaultBranch: 'main',
      rawSource: 'SOME_RAW_SOURCE',
      githubResponse: { id: 12345 }
    },
    summary: {
      languages: [
        {
          name: 'JavaScript',
          evidence: [
            { type: 'lang', source: { path: 'src/index.js', field: 'extension' }, detail: 'JS file' }
          ]
        }
      ],
      frameworks: [],
      libraries: []
    },
    structure: {
      directories: [],
      importantFiles: [
        { path: 'docker-compose.yml', evidence: { type: 'file', source: { path: 'docker-compose.yml', field: null }, detail: 'Compose file' } }
      ],
      entryPoints: []
    },
    dependencies: {
      manifests: [],
      packages: [
        { name: 'express', version: '4.17.1', evidence: { type: 'dep', source: { path: 'package.json', field: 'dependencies.express' }, detail: 'In package.json' } }
      ]
    },
    api: { indicators: [] },
    database: {
      indicators: [
        { type: 'mongo', name: 'mongoose', evidence: { type: 'db', source: { path: 'src/db.js', field: null }, detail: 'Found mongoose' } }
      ]
    },
    authentication: { indicators: [] },
    testing: { indicators: [] },
    documentation: { indicators: [] },
    deployment: { indicators: [] },
    analysisMetadata: {
      analysisVersion: '1.0.0',
      limitations: ['Limit: 50 files']
    },
    // Simulate mongoose toObject
    toObject: function() { return { ...this, toObject: undefined }; }
  });

  test('Fully populated ProjectAnalysis maps correctly and exactly preserves path, field, and detail', () => {
    const mockData = createMockAnalysis();
    const context = buildAIContext(mockData);

    assert.strictEqual(context.repository.fullName, 'testowner/testrepo');
    assert.strictEqual(context.repository.defaultBranch, 'main');
    
    // Check languages provenance
    const langProv = context.technical_evidence.summary.languages[0].provenance[0];
    assert.strictEqual(langProv.path, 'src/index.js');
    assert.strictEqual(langProv.field, 'extension');
    assert.strictEqual(langProv.detail, 'JS file');
    
    // Check packages provenance
    const pkgProv = context.technical_evidence.dependencies.packages[0].provenance;
    assert.strictEqual(pkgProv.path, 'package.json');
    assert.strictEqual(pkgProv.field, 'dependencies.express');
    assert.strictEqual(pkgProv.detail, 'In package.json');

    // Check indicator provenance
    const dbInd = context.technical_evidence.indicators.database[0];
    assert.strictEqual(dbInd.type, 'mongo');
    assert.strictEqual(dbInd.name, 'mongoose');
    assert.strictEqual(dbInd.provenance.path, 'src/db.js');
    assert.strictEqual(dbInd.provenance.field, null);
    assert.strictEqual(dbInd.provenance.detail, 'Found mongoose');
  });

  test('Mongo internals and persistence metadata are excluded', () => {
    const mockData = createMockAnalysis();
    const context = buildAIContext(mockData);

    const jsonString = JSON.stringify(context);
    assert.strictEqual(jsonString.includes('_id'), false);
    assert.strictEqual(jsonString.includes('__v'), false);
    assert.strictEqual(jsonString.includes('createdAt'), false);
    assert.strictEqual(jsonString.includes('updatedAt'), false);
    assert.strictEqual(jsonString.includes('analysisVersion'), false);
  });

  test('Empty arrays are preserved deterministically', () => {
    const mockData = createMockAnalysis();
    const context = buildAIContext(mockData);

    assert.deepStrictEqual(context.technical_evidence.summary.frameworks, []);
    assert.deepStrictEqual(context.technical_evidence.indicators.api, []);
    assert.deepStrictEqual(context.technical_evidence.indicators.testing, []);
  });

  test('Contextual guidance is prepended to limitations', () => {
    const mockData = createMockAnalysis();
    const context = buildAIContext(mockData);

    assert.strictEqual(context.analysis_limitations.length, 2);
    assert.strictEqual(
      context.analysis_limitations[0].includes('Contextual Guidance'), 
      true
    );
    assert.strictEqual(context.analysis_limitations[1], 'Limit: 50 files');
  });

  test('Input ProjectAnalysis is not mutated', () => {
    const mockData = createMockAnalysis();
    const originalJson = JSON.stringify(mockData);
    buildAIContext(mockData);
    const postJson = JSON.stringify(mockData);
    assert.strictEqual(originalJson, postJson);
  });

  test('Repeated calls with the same input produce equivalent output', () => {
    const mockData = createMockAnalysis();
    const result1 = buildAIContext(mockData);
    const result2 = buildAIContext(mockData);
    assert.deepStrictEqual(result1, result2);
  });

  test('Raw repository source and GitHub response fields cannot appear in the resulting context', () => {
    const mockData = createMockAnalysis();
    const context = buildAIContext(mockData);

    const jsonString = JSON.stringify(context);
    assert.strictEqual(jsonString.includes('SOME_RAW_SOURCE'), false);
    assert.strictEqual(jsonString.includes('githubResponse'), false);
  });
});
