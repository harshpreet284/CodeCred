import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export async function getRepository(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeCred-App'
  };

  if (config.githubToken) {
    headers['Authorization'] = `Bearer ${config.githubToken}`;
  }

  let response;
  try {
    response = await fetch(url, { headers });
  } catch (error) {
    throw new AppError('Network error while contacting GitHub', 502, 'GITHUB_NETWORK_ERROR');
  }

  if (!response.ok) {
    await handleGitHubError(response);
  }

  const data = await response.json();
  return normalizeRepository(data);
}

export async function handleGitHubError(response) {
  const status = response.status;
  
  if (status === 404) {
    throw new AppError('Repository not found or is private', 404, 'REPO_NOT_FOUND');
  }
  
  if (status === 401) {
    throw new AppError('Invalid GitHub API token configuration', 401, 'GITHUB_UNAUTHORIZED');
  }

  if (status === 403 || status === 429) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0' || status === 429) {
      throw new AppError('GitHub API rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }
    throw new AppError('GitHub API access forbidden', 403, 'GITHUB_FORBIDDEN');
  }

  if (status >= 500) {
    throw new AppError('GitHub API is currently unavailable', 502, 'GITHUB_API_ERROR');
  }

  throw new AppError(`Unexpected GitHub API error: ${status}`, 500, 'GITHUB_API_ERROR');
}

function normalizeRepository(data) {
  return {
    owner: data.owner?.login || '',
    name: data.name || '',
    fullName: data.full_name || '',
    description: data.description || '',
    htmlUrl: data.html_url || '',
    defaultBranch: data.default_branch || '',
    language: data.language || null,
    visibility: data.visibility || 'public',
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    openIssues: data.open_issues_count || 0,
    createdAt: data.created_at || null,
    updatedAt: data.updated_at || null
  };
}
