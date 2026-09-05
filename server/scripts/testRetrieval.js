import { getRepository } from '../src/services/githubService.js';
import { retrieveAndNormalizeRepositoryInput } from '../src/services/githubContentService.js';

async function run() {
  try {
    const owner = process.argv[2] || 'expressjs';
    const repo = process.argv[3] || 'express';

    console.log(`\nFetching repository metadata for ${owner}/${repo}...`);
    const repository = await getRepository(owner, repo);
    
    console.log(`Starting retrieval (branch: ${repository.defaultBranch})...`);
    
    const result = await retrieveAndNormalizeRepositoryInput(repository);
    
    console.log('\n=== RETRIEVAL SUMMARY ===');
    console.log(`Repository: ${result.repository.fullName}`);
    console.log(`Default Branch: ${result.repository.defaultBranch}`);
    console.log(`Total Tree Files: ${result.tree.files.length}`);
    console.log(`Tree Truncated: ${result.tree.truncated}`);
    console.log(`Total Directories: ${result.tree.directories.length}`);
    
    console.log('\n--- FETCHED FILES ---');
    let fetched = 0;
    let skippedSize = 0;
    let skippedTotal = 0;
    
    for (const file of result.files) {
      if (file.contentStatus === 'complete') {
        fetched++;
        console.log(` [✓] ${file.path} (${Buffer.byteLength(file.content, 'utf8')} bytes)`);
      } else if (file.contentStatus === 'skipped_size_limit') {
        skippedSize++;
        console.log(` [S] ${file.path} (Skipped: exceeds max file size)`);
      } else if (file.contentStatus === 'skipped_total_limit') {
        skippedTotal++;
        console.log(` [T] ${file.path} (Skipped: exceeds total content limit)`);
      }
    }
    
    console.log('\n--- STATS ---');
    console.log(`Fetched successfully: ${fetched}`);
    console.log(`Skipped (file limit): ${skippedSize}`);
    console.log(`Skipped (total limit): ${skippedTotal}`);
    
    const sample = result.files.find(f => f.contentStatus === 'complete');
    if (sample) {
      console.log(`\nSample snippet from ${sample.path}:`);
      console.log(sample.content.substring(0, 200) + '...');
    }

  } catch (err) {
    console.error('Error during retrieval:', err);
    process.exit(1);
  }
}

run();
