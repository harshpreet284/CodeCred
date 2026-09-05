import { parseGitHubUrl } from '../utils/githubParser.js';
import { getRepository } from './githubService.js';
import { retrieveAndNormalizeRepositoryInput } from './githubContentService.js';
import { runDeterministicAnalysis } from './analysis/analysisOrchestrator.js';
import { saveAnalysis, getAnalysisById } from './projectAnalysisService.js';

/**
 * Orchestrates the full analysis workflow for a given GitHub repository URL.
 * Coordinates validation, retrieval, deterministic analysis, and persistence.
 * 
 * @param {string} url - The GitHub repository URL to analyze.
 * @returns {Promise<Object>} A safe Data Transfer Object representing the persisted analysis.
 */
export async function analyzeRepository(url) {
  // 1. Validation & Identity
  const { owner, repo } = parseGitHubUrl(url);
  
  // 2. Metadata Retrieval
  const repositoryMetadata = await getRepository(owner, repo);
  
  // 3. Normalized Content Retrieval
  const retrievalOutput = await retrieveAndNormalizeRepositoryInput(repositoryMetadata);
  
  // 4. Deterministic Analysis
  const analysisPayload = runDeterministicAnalysis(retrievalOutput);
  
  // 5. Persistence
  const savedDocument = await saveAnalysis(analysisPayload);
  
  // 6. Return Safe Output (DTO Boundary)
  return createSafeDTO(savedDocument);
}

/**
 * Retrieves a specific analysis snapshot by its MongoDB _id.
 * 
 * @param {string} analysisId - The ID of the analysis to retrieve.
 * @returns {Promise<Object>} A safe Data Transfer Object representing the persisted analysis.
 */
export async function getAnalysis(analysisId) {
  const document = await getAnalysisById(analysisId);
  return createSafeDTO(document);
}

/**
 * Helper to construct the safe DTO from a Mongoose document.
 */
function createSafeDTO(savedDocument) {
  const analysisObj = savedDocument.toObject();
  
  return {
    analysisId: savedDocument._id.toString(),
    repository: analysisObj.repository,
    analysis: {
      summary: analysisObj.summary,
      structure: analysisObj.structure,
      dependencies: analysisObj.dependencies,
      api: analysisObj.api,
      database: analysisObj.database,
      authentication: analysisObj.authentication,
      testing: analysisObj.testing,
      documentation: analysisObj.documentation,
      deployment: analysisObj.deployment,
      analysisMetadata: analysisObj.analysisMetadata
    },
    createdAt: analysisObj.createdAt,
    updatedAt: analysisObj.updatedAt
  };
}
