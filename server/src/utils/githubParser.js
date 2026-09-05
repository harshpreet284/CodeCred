import { AppError } from './AppError.js';

export function parseGitHubUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new AppError('GitHub repository URL is required', 400, 'INVALID_GITHUB_URL');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(inputUrl);
  } catch (err) {
    throw new AppError('Invalid URL format', 400, 'INVALID_GITHUB_URL');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new AppError('URL must use HTTPS protocol', 400, 'INVALID_GITHUB_URL');
  }

  if (parsedUrl.port !== '') {
    throw new AppError('URL must not contain a non-standard port', 400, 'INVALID_GITHUB_URL');
  }

  if (parsedUrl.search !== '') {
    throw new AppError('URL must not contain query parameters', 400, 'INVALID_GITHUB_URL');
  }

  if (parsedUrl.hash !== '') {
    throw new AppError('URL must not contain fragments', 400, 'INVALID_GITHUB_URL');
  }

  if (parsedUrl.hostname !== 'github.com' && parsedUrl.hostname !== 'www.github.com') {
    throw new AppError('URL must be a github.com repository', 400, 'INVALID_GITHUB_URL');
  }

  // Remove leading and trailing slashes
  const path = parsedUrl.pathname.replace(/^\/|\/$/g, '');
  const pathParts = path.split('/');

  if (pathParts.length !== 2) {
    throw new AppError('URL must point exactly to a repository (e.g., https://github.com/owner/repo)', 400, 'INVALID_GITHUB_URL');
  }

  const [owner, rawRepo] = pathParts;

  // Safely handle .git suffix if present
  const repo = rawRepo.endsWith('.git') ? rawRepo.slice(0, -4) : rawRepo;

  // Validate owner and repo names (reject encoded path separators or malformed inputs)
  const validNameRegex = /^[A-Za-z0-9_.-]+$/;
  
  if (!owner || !repo || !validNameRegex.test(owner) || !validNameRegex.test(repo)) {
    throw new AppError('Invalid owner or repository name in URL', 400, 'INVALID_GITHUB_URL');
  }

  return { owner, repo };
}
