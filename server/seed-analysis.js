/**
 * seed-analysis.js
 * 
 * Seeds a realistic ProjectAnalysis document into the in-memory dev MongoDB.
 * Run AFTER dev-server.js is already started.
 * 
 * Usage: node seed-analysis.js
 */

import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI not set. Is dev-server.js running?');
  process.exit(1);
}

await mongoose.connect(uri);

// Import after connection established
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
      { name: 'JavaScript', evidence: [{ type: 'repository_metadata', source: { path: null, field: 'language' }, detail: 'GitHub repository language metadata reports JavaScript' }] },
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
  database: {
    indicators: []
  },
  authentication: {
    indicators: []
  },
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
  deployment: {
    indicators: []
  },
  analysisMetadata: {
    analysisVersion: '1.0.0',
    limitations: ['5 file(s) skipped due to individual size limits.']
  }
};

const doc = new ProjectAnalysis(seed);
const saved = await doc.save();

console.log('Seeded analysis ID:', saved._id.toString());

await mongoose.disconnect();
