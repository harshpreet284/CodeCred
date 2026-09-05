import { createEvidence } from '../utils/evidenceBuilder.js';

const EXTENSION_MAP = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript (React)',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.c': 'C',
  '.cpp': 'C++',
  '.cs': 'C#',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.kt': 'Kotlin'
};

export function analyzeLanguages(retrievalOutput) {
  const languages = [];
  
  // 1. Repository metadata
  if (retrievalOutput.repository && retrievalOutput.repository.language) {
    languages.push({
      name: retrievalOutput.repository.language,
      evidence: [
        createEvidence('repository_metadata', null, 'language', `GitHub repository language metadata reports ${retrievalOutput.repository.language}`)
      ]
    });
  }
  
  // 2. File-extension signals
  const extensionCounts = {};
  for (const file of retrievalOutput.tree.files) {
    const dotIndex = file.path.lastIndexOf('.');
    if (dotIndex > 0) {
      const ext = file.path.substring(dotIndex).toLowerCase();
      if (EXTENSION_MAP[ext]) {
        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
      }
    }
  }
  
  for (const [ext, count] of Object.entries(extensionCounts)) {
    const name = EXTENSION_MAP[ext];
    
    // Check if we already have this language from metadata
    let existingLang = languages.find(l => l.name === name || l.name === name.split(' ')[0]);
    
    if (existingLang) {
      existingLang.evidence.push(
        createEvidence('file_extension_signal', null, null, `Found ${count} file(s) with ${ext} extension`)
      );
    } else {
      languages.push({
        name: name,
        evidence: [
          createEvidence('file_extension_signal', null, null, `Found ${count} file(s) with ${ext} extension`)
        ]
      });
    }
  }
  
  return languages;
}
