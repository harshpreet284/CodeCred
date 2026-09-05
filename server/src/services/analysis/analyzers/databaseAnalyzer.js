import { createEvidence } from '../utils/evidenceBuilder.js';

const DB_PACKAGES = ['mongoose', 'mongodb', 'pg', 'mysql', 'mysql2', 'sequelize', 'prisma', 'typeorm', 'sqlite3'];

export function analyzeDatabase(retrievalOutput, dependencies) {
  const indicators = [];

  // 1. Dependency Evidence
  for (const pkg of dependencies.packages) {
    if (DB_PACKAGES.includes(pkg.name)) {
      indicators.push({
        type: 'database_dependency',
        name: pkg.name,
        evidence: createEvidence('dependency_declaration', pkg.evidence.source.path, pkg.evidence.source.field, `Found '${pkg.name}' in dependencies`)
      });
    }
  }

  // 2. Import & Configuration Evidence
  for (const file of retrievalOutput.files) {
    if (file.contentStatus !== 'complete' || !file.content) continue;
    if (!file.path.match(/\.(js|ts|py|go|java)$/i)) continue;

    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const commentIdx = line.indexOf('//');
      if (commentIdx !== -1) line = line.substring(0, commentIdx);
      
      // Import evidence
      if (line.match(/require\(['"](mongoose|mongodb|pg|mysql|mysql2|sequelize|prisma|typeorm)['"]\)/) ||
          line.match(/import.*from\s+['"](mongoose|mongodb|pg|mysql|mysql2|sequelize|prisma|typeorm)['"]/)) {
        indicators.push({
          type: 'database_import',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected database library import')
        });
      }

      // Configuration / Connection evidence
      if (line.match(/\.connect\(/) && (file.path.toLowerCase().includes('db') || file.path.toLowerCase().includes('mongoose') || file.path.toLowerCase().includes('mongo'))) {
        indicators.push({
          type: 'database_connection',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected likely database connection pattern')
        });
      }
      if (line.match(/new\s+Sequelize\(/) || line.match(/new\s+PrismaClient\(/)) {
        indicators.push({
          type: 'database_connection',
          evidence: createEvidence('source_code_pattern', file.path, `line ${i + 1}`, 'Detected ORM client initialization')
        });
      }
    }
  }
  
  // 3. Schema files
  for (const file of retrievalOutput.tree.files) {
    if (file.path.endsWith('schema.prisma')) {
      indicators.push({
        type: 'database_schema',
        name: 'Prisma Schema',
        evidence: createEvidence('file_presence', file.path, null, 'Detected Prisma schema file')
      });
    }
  }

  return { indicators };
}
