import { createEvidence } from '../utils/evidenceBuilder.js';

export function analyzeDependencies(retrievalOutput) {
  const manifests = [];
  const packages = [];

  for (const file of retrievalOutput.files) {
    if (file.contentStatus !== 'complete' || !file.content) continue;

    if (file.path.endsWith('package.json')) {
      try {
        const parsed = JSON.parse(file.content);
        
        manifests.push({
          path: file.path,
          evidence: createEvidence('manifest', file.path, null, 'Valid package.json found')
        });

        const deps = { ...parsed.dependencies, ...parsed.devDependencies };
        for (const [name, version] of Object.entries(deps)) {
          // Avoid pushing exact duplicates if multiple package.jsons exist, though keeping them is also fine.
          packages.push({
            name,
            version,
            evidence: createEvidence('dependency', file.path, 'dependencies', `Dependency declared in package.json`)
          });
        }
      } catch (err) {
        // Ignore parse error, we just don't extract packages
      }
    } else if (file.path.endsWith('requirements.txt')) {
      manifests.push({
        path: file.path,
        evidence: createEvidence('manifest', file.path, null, 'requirements.txt found')
      });
      
      const lines = file.content.split('\n');
      for (const line of lines) {
        const clean = line.trim();
        if (clean && !clean.startsWith('#')) {
          const match = clean.match(/^([a-zA-Z0-9_\-]+)/);
          if (match) {
            packages.push({
              name: match[1],
              version: 'unknown',
              evidence: createEvidence('dependency', file.path, null, 'Dependency declared in requirements.txt')
            });
          }
        }
      }
    }
  }

  return { manifests, packages };
}
