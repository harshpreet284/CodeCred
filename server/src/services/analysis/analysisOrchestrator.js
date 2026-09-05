import { analyzeLanguages } from './analyzers/languageAnalyzer.js';
import { analyzeStructure } from './analyzers/structureAnalyzer.js';
import { analyzeDependencies } from './analyzers/dependencyAnalyzer.js';
import { analyzeFrameworks } from './analyzers/frameworkAnalyzer.js';
import { analyzeLibraries } from './analyzers/libraryAnalyzer.js';
import { analyzeApi } from './analyzers/apiAnalyzer.js';
import { analyzeDatabase } from './analyzers/databaseAnalyzer.js';
import { analyzeSecurity } from './analyzers/securityAnalyzer.js';
import { analyzeTesting } from './analyzers/testingAnalyzer.js';
import { analyzeDocumentation } from './analyzers/documentationAnalyzer.js';
import { analyzeDeployment } from './analyzers/deploymentAnalyzer.js';

export function runDeterministicAnalysis(retrievalOutput) {
  if (!retrievalOutput || !retrievalOutput.tree) {
    throw new Error('Invalid retrieval output provided to analysis orchestrator.');
  }

  const languages = analyzeLanguages(retrievalOutput);
  const structure = analyzeStructure(retrievalOutput);
  const dependencies = analyzeDependencies(retrievalOutput);
  const api = analyzeApi(retrievalOutput);
  const documentation = analyzeDocumentation(retrievalOutput);
  const deployment = analyzeDeployment(retrievalOutput);

  const frameworks = analyzeFrameworks(dependencies);
  const libraries = analyzeLibraries(dependencies);
  const database = analyzeDatabase(retrievalOutput, dependencies);
  const security = analyzeSecurity(retrievalOutput, dependencies);
  const testing = analyzeTesting(retrievalOutput, dependencies);

  const limitations = [];
  let retrievalWasLimited = false;

  if (retrievalOutput.tree.truncated) {
    limitations.push('Tree truncated: structural evidence may be incomplete.');
    retrievalWasLimited = true;
  }
  
  const skippedSize = retrievalOutput.files.filter(f => f.contentStatus === 'skipped_size_limit').length;
  if (skippedSize > 0) {
    limitations.push(`${skippedSize} file(s) skipped due to individual size limits.`);
    retrievalWasLimited = true;
  }

  const skippedTotal = retrievalOutput.files.filter(f => f.contentStatus === 'skipped_total_limit').length;
  if (skippedTotal > 0) {
    limitations.push(`${skippedTotal} file(s) skipped due to total content size limits.`);
    retrievalWasLimited = true;
  }

  if (dependencies.manifests.length === 0 && retrievalWasLimited) {
    limitations.push('Dependency evidence may be incomplete because retrieval was limited.');
  }

  return {
    repository: retrievalOutput.repository || null,
    summary: {
      languages,
      frameworks,
      libraries
    },
    structure,
    dependencies,
    api,
    database,
    authentication: security, 
    testing,
    documentation,
    deployment,
    analysisMetadata: {
      analysisVersion: '1.0.0',
      limitations
    }
  };
}
