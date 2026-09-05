import { createEvidence } from '../utils/evidenceBuilder.js';

export function analyzeDeployment(retrievalOutput) {
  const indicators = [];

  for (const file of retrievalOutput.tree.files) {
    const name = file.path.toLowerCase();
    
    if (name === 'dockerfile') {
      indicators.push({
        type: 'deployment_configuration',
        name: 'Docker',
        evidence: createEvidence('file_presence', file.path, null, 'Detected Dockerfile')
      });
    } else if (name === 'docker-compose.yml' || name === 'docker-compose.yaml') {
      indicators.push({
        type: 'deployment_configuration',
        name: 'Docker Compose',
        evidence: createEvidence('file_presence', file.path, null, 'Detected Docker Compose config')
      });
    } else if (name === 'vercel.json') {
      indicators.push({
        type: 'deployment_configuration',
        name: 'Vercel',
        evidence: createEvidence('file_presence', file.path, null, 'Detected Vercel config')
      });
    } else if (name === 'netlify.toml') {
      indicators.push({
        type: 'deployment_configuration',
        name: 'Netlify',
        evidence: createEvidence('file_presence', file.path, null, 'Detected Netlify config')
      });
    } else if (name.startsWith('.github/workflows/')) {
       indicators.push({
        type: 'ci_cd_configuration',
        name: 'GitHub Actions',
        evidence: createEvidence('file_presence', file.path, null, 'Detected GitHub Actions workflow')
      });
    }
  }

  return { indicators };
}
