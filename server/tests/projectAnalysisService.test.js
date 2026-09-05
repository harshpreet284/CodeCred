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

  /**
   * Realistic fixture using the ACTUAL Task 6 analyzer output shapes.
   *
   * Every field here reflects what the live deterministic analyzers produce:
   *   - summary.languages: NamedItemSchema  { name, evidence: [EvidenceLeaf] }
   *   - summary.frameworks: NamedItemSchema { name, evidence: [EvidenceLeaf] }
   *   - summary.libraries:  NamedItemSchema { name, evidence: [EvidenceLeaf] }
   *   - structure.directories: PathItemSchema  { path, evidence: EvidenceLeaf }
   *   - structure.entryPoints: PathItemSchema  { path, evidence: EvidenceLeaf }
   *   - dependencies.manifests: PathItemSchema { path, evidence: EvidenceLeaf }
   *   - dependencies.packages:  PackageItemSchema { name, version, evidence: EvidenceLeaf }
   *   - api/database/.../deployment indicators: IndicatorSchema { type, name?, evidence: EvidenceLeaf }
   *
   * EvidenceLeaf shape (from createEvidence): { type, source: {path, field}, detail }
   */
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
          name: 'JavaScript',
          evidence: [
            {
              type: 'repository_metadata',
              source: { path: null, field: 'language' },
              detail: 'GitHub repository language metadata reports JavaScript'
            }
          ]
        }
      ],
      frameworks: [
        {
          name: 'Express',
          evidence: [
            {
              type: 'dependency',
              source: { path: 'package.json', field: 'dependencies' },
              detail: 'Dependency declared in package.json'
            }
          ]
        }
      ],
      libraries: []
    },
    structure: {
      directories: [
        {
          path: 'lib',
          evidence: {
            type: 'tree_structure',
            source: { path: 'lib', field: null },
            detail: "Detected standard structural directory 'lib'"
          }
        }
      ],
      importantFiles: [],
      entryPoints: [
        {
          path: 'index.js',
          evidence: {
            type: 'tree_structure',
            source: { path: 'index.js', field: null },
            detail: "Detected likely entry point file 'index.js'"
          }
        }
      ]
    },
    dependencies: {
      manifests: [
        {
          path: 'package.json',
          evidence: {
            type: 'manifest',
            source: { path: 'package.json', field: null },
            detail: 'Valid package.json found'
          }
        }
      ],
      packages: [
        {
          name: 'mocha',
          version: '^10.0.0',
          evidence: {
            type: 'dependency',
            source: { path: 'package.json', field: 'devDependencies' },
            detail: 'Dependency declared in package.json'
          }
        }
      ]
    },
    api: {
      indicators: [
        {
          type: 'api_usage',
          name: null,
          evidence: {
            type: 'source_code_pattern',
            source: { path: 'lib/router/index.js', field: 'line 14' },
            detail: 'Detected http/https.request indicator'
          }
        }
      ]
    },
    database: { indicators: [] },
    authentication: { indicators: [] },
    testing: {
      indicators: [
        {
          type: 'testing_dependency',
          name: 'mocha',
          evidence: {
            type: 'dependency_declaration',
            source: { path: 'package.json', field: 'devDependencies' },
            detail: "Found 'mocha' in dependencies"
          }
        },
        {
          type: 'testing_directory',
          name: null,
          evidence: {
            type: 'tree_structure',
            source: { path: 'test', field: null },
            detail: "Detected standard testing directory 'test'"
          }
        }
      ]
    },
    documentation: {
      indicators: [
        {
          type: 'documentation_file',
          name: 'README',
          evidence: {
            type: 'file_presence',
            source: { path: 'Readme.md', field: null },
            detail: 'Detected README file'
          }
        }
      ]
    },
    deployment: { indicators: [] },
    analysisMetadata: {
      analysisVersion: '1.0.0',
      limitations: ['5 file(s) skipped due to individual size limits.']
    }
  };

  it('should successfully perform a full save -> getById round-trip with the actual Task 6 analyzer output shapes', async () => {
    const saved = await saveAnalysis(realisticFixture);
    assert.ok(saved._id);
    assert.strictEqual(saved.repository.fullName, 'expressjs/express');
    assert.ok(saved.createdAt);
    assert.ok(saved.updatedAt);

    const retrieved = await getAnalysisById(saved._id.toString());
    assert.ok(retrieved);

    // Repository identity
    assert.strictEqual(retrieved.repository.owner, 'expressjs');
    assert.strictEqual(retrieved.repository.name, 'express');
    assert.strictEqual(retrieved.repository.fullName, 'expressjs/express');
    assert.strictEqual(retrieved.repository.defaultBranch, 'master');

    // summary.languages — NamedItemSchema: { name, evidence: [EvidenceLeaf] }
    assert.strictEqual(retrieved.summary.languages.length, 1);
    assert.strictEqual(retrieved.summary.languages[0].name, 'JavaScript');
    assert.strictEqual(retrieved.summary.languages[0].evidence.length, 1);
    assert.strictEqual(retrieved.summary.languages[0].evidence[0].type, 'repository_metadata');
    assert.strictEqual(retrieved.summary.languages[0].evidence[0].source.field, 'language');
    assert.strictEqual(retrieved.summary.languages[0].evidence[0].detail, 'GitHub repository language metadata reports JavaScript');

    // summary.frameworks — NamedItemSchema
    assert.strictEqual(retrieved.summary.frameworks.length, 1);
    assert.strictEqual(retrieved.summary.frameworks[0].name, 'Express');

    // structure.directories — PathItemSchema: { path, evidence: EvidenceLeaf }
    assert.strictEqual(retrieved.structure.directories.length, 1);
    assert.strictEqual(retrieved.structure.directories[0].path, 'lib');
    assert.strictEqual(retrieved.structure.directories[0].evidence.type, 'tree_structure');
    assert.strictEqual(retrieved.structure.directories[0].evidence.detail, "Detected standard structural directory 'lib'");

    // structure.entryPoints — PathItemSchema
    assert.strictEqual(retrieved.structure.entryPoints.length, 1);
    assert.strictEqual(retrieved.structure.entryPoints[0].path, 'index.js');

    // dependencies.manifests — PathItemSchema
    assert.strictEqual(retrieved.dependencies.manifests.length, 1);
    assert.strictEqual(retrieved.dependencies.manifests[0].path, 'package.json');
    assert.strictEqual(retrieved.dependencies.manifests[0].evidence.type, 'manifest');

    // dependencies.packages — PackageItemSchema: { name, version, evidence: EvidenceLeaf }
    assert.strictEqual(retrieved.dependencies.packages.length, 1);
    assert.strictEqual(retrieved.dependencies.packages[0].name, 'mocha');
    assert.strictEqual(retrieved.dependencies.packages[0].version, '^10.0.0');
    assert.strictEqual(retrieved.dependencies.packages[0].evidence.type, 'dependency');

    // api.indicators — IndicatorSchema: { type, name?, evidence: EvidenceLeaf }
    assert.strictEqual(retrieved.api.indicators.length, 1);
    assert.strictEqual(retrieved.api.indicators[0].type, 'api_usage');
    assert.strictEqual(retrieved.api.indicators[0].evidence.source.path, 'lib/router/index.js');

    // testing.indicators — IndicatorSchema
    assert.strictEqual(retrieved.testing.indicators.length, 2);
    assert.strictEqual(retrieved.testing.indicators[0].type, 'testing_dependency');
    assert.strictEqual(retrieved.testing.indicators[0].name, 'mocha');
    assert.strictEqual(retrieved.testing.indicators[1].type, 'testing_directory');

    // documentation.indicators — IndicatorSchema
    assert.strictEqual(retrieved.documentation.indicators.length, 1);
    assert.strictEqual(retrieved.documentation.indicators[0].type, 'documentation_file');
    assert.strictEqual(retrieved.documentation.indicators[0].name, 'README');

    // Empty indicator arrays persist cleanly
    assert.strictEqual(retrieved.database.indicators.length, 0);
    assert.strictEqual(retrieved.authentication.indicators.length, 0);
    assert.strictEqual(retrieved.deployment.indicators.length, 0);

    // analysisMetadata
    assert.strictEqual(retrieved.analysisMetadata.analysisVersion, '1.0.0');
    assert.strictEqual(retrieved.analysisMetadata.limitations.length, 1);
    assert.strictEqual(retrieved.analysisMetadata.limitations[0], '5 file(s) skipped due to individual size limits.');

    // Verify raw source content is NOT persisted (no files/content field)
    assert.strictEqual(retrieved.files, undefined);
    assert.strictEqual(retrieved.toObject().files, undefined);
  });

  it('should fail schema validation on malformed payload — missing required repository fields', async () => {
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

  it('should fail schema validation on NamedItemSchema — missing required name field', async () => {
    const invalidPayload = {
      ...realisticFixture,
      summary: {
        languages: [
          {
            // name is required — omitting it
            evidence: [{ type: 'repo_metadata', source: { path: null, field: null }, detail: 'test' }]
          }
        ],
        frameworks: [],
        libraries: []
      }
    };

    try {
      await saveAnalysis(invalidPayload);
      assert.fail('Should have thrown validation error');
    } catch (err) {
      assert.strictEqual(err.code, 'VALIDATION_ERROR');
      assert.ok(err.message.includes('Analysis Validation Failed'));
    }
  });

  it('should fail schema validation on EvidenceLeafSchema — missing required detail field', async () => {
    const invalidPayload = {
      ...realisticFixture,
      api: {
        indicators: [
          {
            type: 'api_usage',
            evidence: {
              type: 'source_code_pattern',
              source: { path: 'index.js', field: null }
              // detail is required — omitting it
            }
          }
        ]
      }
    };

    try {
      await saveAnalysis(invalidPayload);
      assert.fail('Should have thrown validation error');
    } catch (err) {
      assert.strictEqual(err.code, 'VALIDATION_ERROR');
      assert.ok(err.message.includes('Analysis Validation Failed'));
    }
  });

  it('should fail schema validation on IndicatorSchema — missing required type field', async () => {
    const invalidPayload = {
      ...realisticFixture,
      testing: {
        indicators: [
          {
            // type is required — omitting it
            name: 'mocha',
            evidence: {
              type: 'dependency_declaration',
              source: { path: 'package.json', field: null },
              detail: 'Found mocha'
            }
          }
        ]
      }
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

  it('should not persist raw repository source content', async () => {
    // The schema has no `files` or `content` fields — Mongoose strips unknown fields
    const payloadWithExtraContent = {
      ...realisticFixture,
      files: [{ path: 'index.js', content: 'const x = 1;' }], // must be silently dropped
    };

    const saved = await saveAnalysis(payloadWithExtraContent);
    const retrieved = await getAnalysisById(saved._id.toString());
    const plain = retrieved.toObject();

    assert.strictEqual(plain.files, undefined, 'raw source files must not be persisted');
  });
});
