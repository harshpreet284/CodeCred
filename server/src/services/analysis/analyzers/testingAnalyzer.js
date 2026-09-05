import { createEvidence } from '../utils/evidenceBuilder.js';

const TEST_PACKAGES = ['jest', 'mocha', 'chai', 'vitest', 'cypress', 'playwright', 'supertest', 'pytest', 'unittest'];

export function analyzeTesting(retrievalOutput, dependencies) {
  const indicators = [];

  for (const pkg of dependencies.packages) {
    if (TEST_PACKAGES.includes(pkg.name)) {
      indicators.push({
        type: 'testing_dependency',
        name: pkg.name,
        evidence: createEvidence('dependency_declaration', pkg.evidence.source.path, pkg.evidence.source.field, `Found '${pkg.name}' in dependencies`)
      });
    }
  }

  for (const dir of retrievalOutput.tree.directories) {
    const parts = dir.split('/');
    const name = parts[parts.length - 1];
    
    if (['test', 'tests', '__tests__', 'spec', 'specs'].includes(name.toLowerCase())) {
      indicators.push({
        type: 'testing_directory',
        evidence: createEvidence('tree_structure', dir, null, `Detected standard testing directory '${name}'`)
      });
    }
  }

  return { indicators };
}
