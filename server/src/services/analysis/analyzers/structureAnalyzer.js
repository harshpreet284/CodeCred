import { createEvidence } from '../utils/evidenceBuilder.js';

const IMPORTANT_DIRS = ['src', 'server', 'client', 'api', 'lib', 'app', 'public', 'components', 'utils'];
const ENTRY_POINTS = ['index.js', 'server.js', 'app.js', 'main.go', 'main.py', 'manage.py', 'app.py', 'index.ts', 'main.ts'];

export function analyzeStructure(retrievalOutput) {
  const directories = [];
  const entryPoints = [];
  const importantFiles = [];

  // Identify important top-level or structural directories
  for (const dir of retrievalOutput.tree.directories) {
    const parts = dir.split('/');
    const name = parts[parts.length - 1];
    
    if (IMPORTANT_DIRS.includes(name) && parts.length <= 2) {
      directories.push({
        path: dir,
        evidence: createEvidence('tree_structure', dir, null, `Detected standard structural directory '${name}'`)
      });
    }
  }

  // Identify entry points
  for (const file of retrievalOutput.tree.files) {
    const parts = file.path.split('/');
    const name = parts[parts.length - 1];

    if (ENTRY_POINTS.includes(name) && parts.length <= 2) {
      entryPoints.push({
        path: file.path,
        evidence: createEvidence('tree_structure', file.path, null, `Detected likely entry point file '${name}'`)
      });
    }
  }

  return {
    directories,
    importantFiles,
    entryPoints
  };
}
