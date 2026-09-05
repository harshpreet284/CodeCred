import mongoose from 'mongoose';

const EvidenceItemSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String },
  version: { type: String },
  source: {
    path: { type: String },
    field: { type: String }
  },
  detail: { type: String, required: true }
}, { _id: false });

const ProjectAnalysisSchema = new mongoose.Schema({
  repository: {
    owner: { type: String, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true },
    defaultBranch: { type: String, required: true }
  },
  summary: {
    languages: [EvidenceItemSchema],
    frameworks: [EvidenceItemSchema],
    libraries: [EvidenceItemSchema]
  },
  structure: {
    directories: [EvidenceItemSchema],
    importantFiles: [EvidenceItemSchema],
    entryPoints: [EvidenceItemSchema]
  },
  dependencies: {
    manifests: [EvidenceItemSchema],
    packages: [EvidenceItemSchema]
  },
  api: {
    indicators: [EvidenceItemSchema]
  },
  database: {
    indicators: [EvidenceItemSchema]
  },
  authentication: {
    indicators: [EvidenceItemSchema]
  },
  testing: {
    indicators: [EvidenceItemSchema]
  },
  documentation: {
    indicators: [EvidenceItemSchema]
  },
  deployment: {
    indicators: [EvidenceItemSchema]
  },
  analysisMetadata: {
    analysisVersion: { type: String, required: true },
    limitations: [{ type: String }]
  }
}, { timestamps: true });

export const ProjectAnalysis = mongoose.model('ProjectAnalysis', ProjectAnalysisSchema);
