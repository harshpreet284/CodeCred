import { createEvidence } from '../utils/evidenceBuilder.js';

export function analyzeApi(retrievalOutput) {
  const indicators = [];
  
  for (const file of retrievalOutput.files) {
    if (file.contentStatus !== 'complete' || !file.content) continue;
    
    // Only check common source files, avoiding JSON/markdown/etc
    if (!file.path.match(/\.(js|ts|jsx|tsx|py|go|java)$/i)) continue;

    const lines = file.content.split('\n');
    let foundIndicator = false;

    for (let i = 0; i < lines.length; i++) {
      if (foundIndicator) break;

      let line = lines[i];
      
      // Roughly strip single-line comments to reduce false positives
      const commentIdx = line.indexOf('//');
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      
      // Roughly strip strings to avoid matching words inside quotes
      const codeWithoutStrings = line.replace(/(["'\`]).*?\1/g, '');
      
      if (codeWithoutStrings.match(/\bfetch\s*\(/)) {
        indicators.push({
          type: 'api_usage',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected fetch() call indicator')
        });
        foundIndicator = true;
      } else if (codeWithoutStrings.match(/\baxios\.(get|post|put|delete|patch|request)\s*\(/) || codeWithoutStrings.match(/\baxios\s*\(/)) {
         indicators.push({
          type: 'api_usage',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected axios usage indicator')
        });
        foundIndicator = true;
      } else if (codeWithoutStrings.match(/\bXMLHttpRequest\s*\(/)) {
         indicators.push({
          type: 'api_usage',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected XMLHttpRequest usage indicator')
        });
        foundIndicator = true;
      } else if (codeWithoutStrings.match(/\bhttp(s)?\.request\s*\(/)) {
        indicators.push({
          type: 'api_usage',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected Node.js http/https.request indicator')
        });
        foundIndicator = true;
      }
    }
  }

  return { indicators };
}
