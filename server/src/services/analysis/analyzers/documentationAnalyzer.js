import { createEvidence } from '../utils/evidenceBuilder.js';

export function analyzeDocumentation(retrievalOutput) {
  const indicators = [];

  for (const file of retrievalOutput.tree.files) {
    const name = file.path.toLowerCase();
    const parts = name.split('/');
    const basename = parts[parts.length - 1];
    
    if (basename.includes('readme')) {
      indicators.push({
        type: 'documentation_file',
        name: 'README',
        evidence: createEvidence('file_presence', file.path, null, 'Detected README file')
      });
    } else if (basename.includes('contributing')) {
       indicators.push({
        type: 'documentation_file',
        name: 'CONTRIBUTING',
        evidence: createEvidence('file_presence', file.path, null, 'Detected CONTRIBUTING file')
      });
    }
  }
  
  for (const dir of retrievalOutput.tree.directories) {
    const parts = dir.split('/');
    const name = parts[parts.length - 1];
    if (['docs', 'documentation'].includes(name.toLowerCase())) {
      indicators.push({
        type: 'documentation_directory',
        evidence: createEvidence('tree_structure', dir, null, `Detected documentation directory '${name}'`)
      });
    }
  }

  return { indicators };
}
