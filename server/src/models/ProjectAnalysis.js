import mongoose from 'mongoose';

/**
 * ProjectAnalysis — Mongoose persistence model for deterministic repository analysis snapshots.
 *
 * Schema design follows the ACTUAL runtime output of the Task 6 deterministic analyzers.
 * Every analyzer produces structured objects with a nested `evidence` leaf produced by
 * createEvidence(type, path, field, detail) → { type, source: {path, field}, detail }.
 *
 * There are four distinct structural patterns in the Task 6 output:
 *
 *   1. EvidencLeafSchema  — the atomic evidence leaf produced by createEvidence()
 *      Used by: all analyzers as the innermost evidence value
 *      Shape: { type, source: {path, field}, detail }
 *
 *   2. NamedItemSchema — a named artifact (language/framework/library) with a list of evidence leaves
 *      Used by: languageAnalyzer, frameworkAnalyzer, libraryAnalyzer (summary)
 *      Shape: { name, evidence: [EvidenceLeaf] }
 *
 *   3. PathItemSchema — a file/directory identified by its path, with one evidence leaf
 *      Used by: structureAnalyzer (directories, entryPoints), dependencyAnalyzer (manifests)
 *      Shape: { path, evidence: EvidenceLeaf }
 *
 *   4. PackageItemSchema — a declared dependency package
 *      Used by: dependencyAnalyzer (packages)
 *      Shape: { name, version, evidence: EvidenceLeaf }
 *
 *   5. IndicatorSchema — a typed indicator with optional name and one evidence leaf
 *      Used by: apiAnalyzer, databaseAnalyzer, securityAnalyzer, testingAnalyzer,
 *               documentationAnalyzer, deploymentAnalyzer
 *      Shape: { type, name?, evidence: EvidenceLeaf }
 *
 * The _id is disabled on all sub-schemas since they are embedded documents
 * that do not need independent document identity.
 */

const EvidenceLeafSchema = new mongoose.Schema({
  type: { type: String, required: true },
  source: {
    path: { type: String, default: null },
    field: { type: String, default: null }
  },
  detail: { type: String, required: true }
}, { _id: false });

const NamedItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  evidence: { type: [EvidenceLeafSchema], default: [] }
}, { _id: false });

const PathItemSchema = new mongoose.Schema({
  path: { type: String, required: true },
  evidence: { type: EvidenceLeafSchema, required: true }
}, { _id: false });

const PackageItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: String, default: null },
  evidence: { type: EvidenceLeafSchema, required: true }
}, { _id: false });

const IndicatorSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, default: null },
  evidence: { type: EvidenceLeafSchema, required: true }
}, { _id: false });

const ProjectAnalysisSchema = new mongoose.Schema({
  repository: {
    owner: { type: String, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true },
    defaultBranch: { type: String, required: true }
  },
  summary: {
    languages: { type: [NamedItemSchema], default: [] },
    frameworks: { type: [NamedItemSchema], default: [] },
    libraries: { type: [NamedItemSchema], default: [] }
  },
  structure: {
    directories: { type: [PathItemSchema], default: [] },
    importantFiles: { type: [PathItemSchema], default: [] },
    entryPoints: { type: [PathItemSchema], default: [] }
  },
  dependencies: {
    manifests: { type: [PathItemSchema], default: [] },
    packages: { type: [PackageItemSchema], default: [] }
  },
  api: {
    indicators: { type: [IndicatorSchema], default: [] }
  },
  database: {
    indicators: { type: [IndicatorSchema], default: [] }
  },
  authentication: {
    indicators: { type: [IndicatorSchema], default: [] }
  },
  testing: {
    indicators: { type: [IndicatorSchema], default: [] }
  },
  documentation: {
    indicators: { type: [IndicatorSchema], default: [] }
  },
  deployment: {
    indicators: { type: [IndicatorSchema], default: [] }
  },
  analysisMetadata: {
    analysisVersion: { type: String, required: true },
    limitations: [{ type: String }]
  }
}, { timestamps: true });

export const ProjectAnalysis = mongoose.model('ProjectAnalysis', ProjectAnalysisSchema);
