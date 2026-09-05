export const KNOWN_FRAMEWORKS = {
  'react': 'React',
  'next': 'Next.js',
  'express': 'Express',
  'vue': 'Vue.js',
  '@angular/core': 'Angular',
  'svelte': 'Svelte',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI'
};

export function analyzeFrameworks(dependencies) {
  const frameworks = [];
  
  for (const pkg of dependencies.packages) {
    if (KNOWN_FRAMEWORKS[pkg.name]) {
      frameworks.push({
        name: KNOWN_FRAMEWORKS[pkg.name],
        evidence: [ pkg.evidence ]
      });
    }
  }

  return frameworks;
}
