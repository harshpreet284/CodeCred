import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { handleGitHubError } from './githubService.js';
import { selectRelevantFiles } from './fileSelectionService.js';

const getHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeCred-App'
  };
  if (config.githubToken) {
    headers['Authorization'] = `Bearer ${config.githubToken}`;
  }
  return headers;
};

export async function getRepositoryTree(owner, repo, branch) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  
  let response;
  try {
    response = await fetch(url, { headers: getHeaders() });
  } catch (error) {
    throw new AppError('Network error while contacting GitHub', 502, 'GITHUB_NETWORK_ERROR');
  }

  if (!response.ok) {
    await handleGitHubError(response);
  }

  const data = await response.json();
  
  const files = [];
  const directories = [];
  
  for (const item of data.tree) {
    if (item.type === 'blob') {
      files.push({ path: item.path, size: item.size, type: 'blob' });
    } else if (item.type === 'tree') {
      directories.push(item.path);
    }
  }

  return {
    files,
    directories,
    truncated: data.truncated || false
  };
}

export async function fetchFileContent(owner, repo, path, branch) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  
  let response;
  try {
    response = await fetch(url, { headers: getHeaders() });
  } catch (error) {
    throw new AppError('Network error while contacting GitHub', 502, 'GITHUB_NETWORK_ERROR');
  }

  if (!response.ok) {
    await handleGitHubError(response);
  }

  const data = await response.json();
  if (data.encoding !== 'base64') {
    throw new AppError(`Unsupported encoding: ${data.encoding}`, 500, 'GITHUB_API_ERROR');
  }

  return Buffer.from(data.content, 'base64').toString('utf8');
}

export async function retrieveAndNormalizeRepositoryInput(repository) {
  const { owner, name: repo, defaultBranch } = repository;
  
  const tree = await getRepositoryTree(owner, repo, defaultBranch);
  const relevantFiles = selectRelevantFiles(tree.files, config.retrievalLimits.maxFilesToFetch);
  
  const filesOutput = [];
  let currentTotalSize = 0;
  
  for (const file of relevantFiles) {
    if (file.size > config.retrievalLimits.maxFileSize) {
      filesOutput.push({
        path: file.path,
        content: null,
        contentStatus: 'skipped_size_limit'
      });
      continue;
    }

    // We estimate if it exceeds. Since file.size is roughly base size from github tree (often slightly different than decoded bytes), this is a safe upper bound.
    if (currentTotalSize + file.size > config.retrievalLimits.maxTotalContentSize) {
      filesOutput.push({
        path: file.path,
        content: null,
        contentStatus: 'skipped_total_limit'
      });
      continue;
    }

    try {
      const content = await fetchFileContent(owner, repo, file.path, defaultBranch);
      const contentSize = Buffer.byteLength(content, 'utf8');

      if (currentTotalSize + contentSize > config.retrievalLimits.maxTotalContentSize) {
        filesOutput.push({
          path: file.path,
          content: null,
          contentStatus: 'skipped_total_limit'
        });
        continue;
      }

      currentTotalSize += contentSize;
      
      filesOutput.push({
        path: file.path,
        content: content,
        contentStatus: 'complete'
      });
    } catch (err) {
      throw err;
    }
  }

  return {
    repository,
    tree,
    files: filesOutput
  };
}
