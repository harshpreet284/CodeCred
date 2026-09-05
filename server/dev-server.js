/**
 * dev-server.js
 * 
 * Development startup script: starts an in-memory MongoDB instance using
 * mongodb-memory-server, then starts the Express application.
 * 
 * Usage: node dev-server.js
 * 
 * This script is for development/verification only.
 * Production requires a proper MONGODB_URI environment variable.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';

const SEED = process.argv.includes('--seed');

const startDevServer = async () => {
  console.log('[dev-server] Starting in-memory MongoDB for development...');
  
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Set MONGODB_URI BEFORE any application modules are imported.
  // env.js reads process.env at import time so this must come first.
  process.env.MONGODB_URI = uri;
  
  console.log('[dev-server] In-memory MongoDB ready');
  
  // Dynamic import AFTER env is set, so env.js reads the correct URI.
  const { connectDB } = await import('./src/config/db.js');
  const { config } = await import('./src/config/env.js');
  const { default: app } = await import('./src/app.js');
  
  await connectDB();
  
  if (SEED) {
    await seedDemoData();
  }
  
  app.listen(config.port, () => {
    console.log(`[dev-server] Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[dev-server] Shutting down...');
    await mongod.stop();
    process.exit(0);
  });
};

async function seedDemoData() {
  const mongoose = (await import('mongoose')).default;
  const { ProjectAnalysis } = await import('./src/models/ProjectAnalysis.js');

  const seed = {
    repository: {
      owner: 'expressjs',
      name: 'express',
      fullName: 'expressjs/express',
      defaultBranch: 'master'
    },
    summary: {
      languages: [
        { name: 'JavaScript', evidence: [{ type: 'repository_metadata', source: { path: null, field: 'language' }, detail: 'GitHub repository language metadata reports JavaScript' }] }
      ],
      frameworks: [
        { name: 'Express', evidence: [{ type: 'dependency', source: { path: 'package.json', field: 'dependencies' }, detail: 'Dependency declared in package.json' }] }
      ],
      libraries: [
        { name: 'finalhandler', evidence: [{ type: 'dependency', source: { path: 'package.json', field: 'dependencies' }, detail: 'Dependency declared in package.json' }] },
        { name: 'qs', evidence: [{ type: 'dependency', source: { path: 'package.json', field: 'dependencies' }, detail: 'Dependency declared in package.json' }] }
      ]
    },
    structure: {
      directories: [
        { path: 'lib', evidence: { type: 'tree_structure', source: { path: 'lib', field: null }, detail: "Detected standard structural directory 'lib'" } },
        { path: 'test', evidence: { type: 'tree_structure', source: { path: 'test', field: null }, detail: "Detected standard structural directory 'test'" } }
      ],
      importantFiles: [],
      entryPoints: [
        { path: 'index.js', evidence: { type: 'tree_structure', source: { path: 'index.js', field: null }, detail: "Detected likely entry point file 'index.js'" } }
      ]
    },
    dependencies: {
      manifests: [
        { path: 'package.json', evidence: { type: 'manifest', source: { path: 'package.json', field: null }, detail: 'Valid package.json found' } }
      ],
      packages: [
        { name: 'express', version: '5.0.0', evidence: { type: 'dependency', source: { path: 'package.json', field: 'dependencies' }, detail: 'Dependency declared in package.json' } },
        { name: 'mocha', version: '^10.0.0', evidence: { type: 'dependency', source: { path: 'package.json', field: 'devDependencies' }, detail: 'Dependency declared in package.json' } }
      ]
    },
    api: {
      indicators: [
        { type: 'api_usage', evidence: { type: 'source_code_pattern', source: { path: 'lib/express.js', field: 'line 25' }, detail: 'Detected http/https.request indicator' } }
      ]
    },
    database: { indicators: [] },
    authentication: { indicators: [] },
    testing: {
      indicators: [
        { type: 'testing_dependency', name: 'mocha', evidence: { type: 'dependency_declaration', source: { path: 'package.json', field: 'devDependencies' }, detail: "Found 'mocha' in dependencies" } },
        { type: 'testing_directory', evidence: { type: 'tree_structure', source: { path: 'test', field: null }, detail: "Detected standard testing directory 'test'" } }
      ]
    },
    documentation: {
      indicators: [
        { type: 'documentation_file', evidence: { type: 'file_presence', source: { path: 'Readme.md', field: null }, detail: 'README file detected' } }
      ]
    },
    deployment: { indicators: [] },
    analysisMetadata: {
      analysisVersion: '1.0.0',
      limitations: ['5 file(s) skipped due to individual size limits.']
    }
  };

  const doc = new ProjectAnalysis(seed);
  const saved = await doc.save();
  console.log(`[dev-server] Seeded demo analysis ID: ${saved._id.toString()}`);
}

startDevServer().catch((err) => {
  console.error('[dev-server] Failed to start:', err);
  process.exit(1);
});
