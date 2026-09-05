export const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git', 'vendor', 'coverage', '.next'];
export const EXCLUDED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', 
  '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', 
  '.dylib', '.woff', '.woff2', '.ttf', '.eot', '.log'
];

const PRIORITY_1_EXACT = [
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 
  'requirements.txt', 'pyproject.toml', 'Pipfile', 'go.mod', 
  'Cargo.toml', 'pom.xml', 'build.gradle', 'README.md'
];

const PRIORITY_2_EXACT = [
  'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 
  'tsconfig.json', 'vite.config.js', 'vite.config.ts', 
  'webpack.config.js', 'jest.config.js', '.env.example', 
  '.eslintrc.js', '.eslintrc.json'
];

export function selectRelevantFiles(treeFiles, maxFilesToFetch) {
  // 1. Filter out excluded dirs and binaries
  const candidates = treeFiles.filter(file => {
    if (file.type !== 'blob') return false;
    
    const parts = file.path.split('/');
    // Check if any directory part is in excluded dirs
    if (parts.some(part => EXCLUDED_DIRS.includes(part))) return false;

    // Check extension
    const filename = parts[parts.length - 1];
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex > 0) {
      const ext = filename.substring(dotIndex).toLowerCase();
      if (EXCLUDED_EXTENSIONS.includes(ext)) return false;
    }

    return true;
  });

  // 2. Score candidates deterministically
  const scoredCandidates = candidates.map(file => {
    const parts = file.path.split('/');
    const filename = parts[parts.length - 1];
    let score = 3; // Default source file priority

    if (PRIORITY_1_EXACT.includes(filename)) {
      score = 1;
    } else if (PRIORITY_2_EXACT.includes(filename)) {
      score = 2;
    } else {
      // General source file. Slightly deprioritize deeper files to prefer root-level logic
      score = 3 + (parts.length * 0.1); 
    }

    return { ...file, score };
  });

  // 3. Sort by score ascending (lower score = higher priority)
  scoredCandidates.sort((a, b) => a.score - b.score);

  // 4. Return bounded subset mapping back to normal file structure
  return scoredCandidates.slice(0, maxFilesToFetch).map(c => ({
    path: c.path,
    size: c.size,
    type: c.type
  }));
}
