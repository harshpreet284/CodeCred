export const KNOWN_LIBRARIES = {
  'lodash': 'Lodash',
  'moment': 'Moment.js',
  'date-fns': 'date-fns',
  'rxjs': 'RxJS',
  'jquery': 'jQuery',
  'd3': 'D3.js',
  'chart.js': 'Chart.js',
  'redux': 'Redux',
  'framer-motion': 'Framer Motion',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'styled-components': 'Styled Components'
};

export function analyzeLibraries(dependencies) {
  const libraries = [];
  
  for (const pkg of dependencies.packages) {
    if (KNOWN_LIBRARIES[pkg.name]) {
      libraries.push({
        name: KNOWN_LIBRARIES[pkg.name],
        evidence: [ pkg.evidence ]
      });
    }
  }

  return libraries;
}
