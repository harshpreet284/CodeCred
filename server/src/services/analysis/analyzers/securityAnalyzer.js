import { createEvidence } from '../utils/evidenceBuilder.js';

const AUTH_PACKAGES = ['jsonwebtoken', 'passport', 'bcrypt', 'bcryptjs', 'express-session', 'next-auth', '@auth/core'];

export function analyzeSecurity(retrievalOutput, dependencies) {
  const indicators = [];

  for (const pkg of dependencies.packages) {
    if (AUTH_PACKAGES.includes(pkg.name)) {
      indicators.push({
        type: 'authentication_dependency',
        name: pkg.name,
        evidence: createEvidence('dependency_declaration', pkg.evidence.source.path, pkg.evidence.source.field, `Found '${pkg.name}' in dependencies`)
      });
    }
  }

  for (const file of retrievalOutput.files) {
    if (file.contentStatus !== 'complete' || !file.content) continue;
    if (!file.path.match(/\.(js|ts|py|go|java)$/i)) continue;

    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const commentIdx = line.indexOf('//');
      if (commentIdx !== -1) line = line.substring(0, commentIdx);

      if (line.match(/require\(['"](jsonwebtoken|passport|bcrypt|bcryptjs|express-session)['"]\)/) ||
          line.match(/import.*from\s+['"](jsonwebtoken|passport|bcrypt|bcryptjs|express-session)['"]/)) {
        indicators.push({
          type: 'authentication_import',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected authentication/security library import')
        });
      }
      
      // Look for JWT signing/verification
      if (line.match(/\.sign\(/) && line.toLowerCase().includes('jwt')) {
         indicators.push({
          type: 'authentication_usage',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected likely JWT signing')
        });
      }
    }
  }

  return { indicators };
}
