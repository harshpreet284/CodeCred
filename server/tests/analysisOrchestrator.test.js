import test from 'node:test';
import assert from 'node:assert';
import { runDeterministicAnalysis } from '../src/services/analysis/analysisOrchestrator.js';

const mockRetrievalOutput = {
  repository: { owner: 'test', name: 'repo', language: 'TypeScript', defaultBranch: 'main' },
  tree: {
    truncated: false,
    directories: ['src', 'test', 'docs', 'src/components'],
    files: [
      { path: 'package.json', type: 'blob' },
      { path: 'src/index.ts', type: 'blob' },
      { path: 'src/db.ts', type: 'blob' },
      { path: 'README.md', type: 'blob' },
      { path: 'Dockerfile', type: 'blob' }
    ]
  },
  files: [
    {
      path: 'package.json',
      contentStatus: 'complete',
      content: JSON.stringify({
        dependencies: {
          'express': '4.17.1',
          'mongoose': '5.11.15',
          'jsonwebtoken': '8.5.1',
          'react': '17.0.2',
          'lodash': '4.17.21'
        },
        devDependencies: {
          'jest': '27.0.6'
        }
      })
    },
    {
      path: 'src/index.ts',
      contentStatus: 'complete',
      content: `
        import express from 'express';
        import jwt from 'jsonwebtoken';
        jwt.sign({ foo: 'bar' }, 'secret');
        // TODO: use fetch() here
        const data = "I am a string with fetch() inside";
        
        axios.get('http://api.com');
      `
    },
    {
      path: 'src/db.ts',
      contentStatus: 'complete',
      content: `
        import mongoose from 'mongoose';
        mongoose.connect('mongodb://localhost/test');
      `
    },
    {
      path: 'src/huge.ts',
      contentStatus: 'skipped_total_limit',
      content: null
    }
  ]
};

test('runDeterministicAnalysis produces expected factual output without overclaims', () => {
  const result = runDeterministicAnalysis(mockRetrievalOutput);

  // 1. Languages
  assert.strictEqual(result.summary.languages.length, 1);
  assert.strictEqual(result.summary.languages[0].name, 'TypeScript');
  assert.strictEqual(result.summary.languages[0].evidence.length, 2); 
  assert.strictEqual(result.summary.languages[0].evidence[0].type, 'repository_metadata');
  assert.strictEqual(result.summary.languages[0].evidence[1].type, 'file_extension_signal');

  // 2. Frameworks
  assert.strictEqual(result.summary.frameworks.length, 2);
  const hasExpress = result.summary.frameworks.some(f => f.name === 'Express');
  assert.strictEqual(hasExpress, true);
  
  // 3. Libraries
  assert.strictEqual(result.summary.libraries.length, 1);
  assert.strictEqual(result.summary.libraries[0].name, 'Lodash');

  // 4. Structure
  assert.ok(result.structure.directories.find(d => d.path === 'src'));
  assert.ok(result.structure.entryPoints.find(e => e.path === 'src/index.ts'));

  // 5. Database
  assert.strictEqual(result.database.indicators.length, 3); 
  const dbDep = result.database.indicators.find(i => i.type === 'database_dependency');
  assert.ok(dbDep);
  const dbImp = result.database.indicators.find(i => i.type === 'database_import');
  assert.ok(dbImp);
  const dbConn = result.database.indicators.find(i => i.type === 'database_connection');
  assert.ok(dbConn);

  // 6. Security/Auth
  assert.strictEqual(result.authentication.indicators.length, 3);
  const authDep = result.authentication.indicators.find(i => i.type === 'authentication_dependency');
  assert.ok(authDep);
  const authImp = result.authentication.indicators.find(i => i.type === 'authentication_import');
  assert.ok(authImp);
  const authUsage = result.authentication.indicators.find(i => i.type === 'authentication_usage');
  assert.ok(authUsage);

  // 7. Testing
  assert.strictEqual(result.testing.indicators.length, 2);
  
  // 8. Documentation
  assert.strictEqual(result.documentation.indicators.length, 2);

  // 9. Deployment
  assert.strictEqual(result.deployment.indicators.length, 1);

  // 10. API
  assert.strictEqual(result.api.indicators.length, 1); 
  assert.strictEqual(result.api.indicators[0].evidence.detail, 'Detected axios usage indicator');

  // 11. Limitations Propagated
  assert.strictEqual(result.analysisMetadata.limitations.length, 1);
  assert.strictEqual(result.analysisMetadata.limitations[0], '1 file(s) skipped due to total content size limits.');
});

test('runDeterministicAnalysis handles missing dependencies gracefully and checks limits', () => {
  const emptyOutput = {
    repository: {},
    tree: { truncated: true, directories: [], files: [] },
    files: []
  };
  const result = runDeterministicAnalysis(emptyOutput);
  
  assert.strictEqual(result.dependencies.manifests.length, 0);
  assert.strictEqual(result.analysisMetadata.limitations.includes('Dependency evidence may be incomplete because retrieval was limited.'), true);
  
  const completelyCleanOutput = {
    repository: {},
    tree: { truncated: false, directories: [], files: [] },
    files: []
  };
  const result2 = runDeterministicAnalysis(completelyCleanOutput);
  // It shouldn't push a limitation for dependencies because there were no limits hit, it's just a true absence.
  assert.strictEqual(result2.analysisMetadata.limitations.length, 0);
});
