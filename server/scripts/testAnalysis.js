import { getRepository } from '../src/services/githubService.js';
import { retrieveAndNormalizeRepositoryInput } from '../src/services/githubContentService.js';
import { runDeterministicAnalysis } from '../src/services/analysis/analysisOrchestrator.js';

async function run() {
  try {
    const owner = process.argv[2] || 'expressjs';
    const repo = process.argv[3] || 'express';

    console.log(`\nFetching repository metadata for ${owner}/${repo}...`);
    const repository = await getRepository(owner, repo);
    
    console.log(`Starting retrieval (branch: ${repository.defaultBranch})...`);
    const retrievalOutput = await retrieveAndNormalizeRepositoryInput(repository);
    
    console.log(`Starting analysis...`);
    const analysis = runDeterministicAnalysis(retrievalOutput);

    console.log('\n=== ANALYSIS OUTPUT ===\n');
    console.log(JSON.stringify(analysis, null, 2));

  } catch (err) {
    console.error('Error during analysis:', err);
    process.exit(1);
  }
}

run();
