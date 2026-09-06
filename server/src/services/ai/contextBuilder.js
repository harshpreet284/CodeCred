/**
 * contextBuilder.js
 * 
 * Transforms a persisted ProjectAnalysis document into a compact, deterministic
 * AI context for Gemini, stripping internal database artifacts while preserving
 * strict evidence provenance. Now extended for Task 10.3 to attach deterministic
 * evidence IDs.
 */

/**
 * Transforms an EvidenceLeaf into the provenance structure.
 * @param {object} leaf - The EvidenceLeaf from the analysis
 * @returns {object|undefined} The mapped provenance object
 */
const mapProvenance = (leaf) => {
  if (!leaf) return undefined;
  return {
    path: leaf.source?.path ?? null,
    field: leaf.source?.field ?? null,
    detail: leaf.detail ?? ''
  };
};

/**
 * Maps an array of NamedItems (e.g. languages, frameworks)
 */
const mapNamedItems = (items, getId) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    evidenceId: getId(),
    name: item.name,
    provenance: Array.isArray(item.evidence) ? item.evidence.map(mapProvenance) : []
  }));
};

/**
 * Maps an array of PathItems (e.g. directories, entryPoints)
 */
const mapPathItems = (items, getId) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    evidenceId: getId(),
    path: item.path,
    provenance: mapProvenance(item.evidence)
  }));
};

/**
 * Maps an array of PackageItems (e.g. dependencies.packages)
 */
const mapPackageItems = (items, getId) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    evidenceId: getId(),
    name: item.name,
    version: item.version ?? null,
    provenance: mapProvenance(item.evidence)
  }));
};

/**
 * Maps an array of Indicators (e.g. api, database)
 */
const mapIndicators = (indicators, getId) => {
  if (!Array.isArray(indicators)) return [];
  return indicators.map(ind => ({
    evidenceId: getId(),
    type: ind.type,
    name: ind.name ?? null,
    provenance: mapProvenance(ind.evidence)
  }));
};

/**
 * Builds the plain JavaScript object AI context from a ProjectAnalysis document.
 * 
 * @param {object} projectAnalysis - The persisted ProjectAnalysis document (Mongoose doc or POJO)
 * @returns {object} The deterministic AI context
 */
export const buildAIContext = (projectAnalysis) => {
  if (!projectAnalysis) {
    throw new Error('ProjectAnalysis is required to build AI context');
  }

  // Handle Mongoose documents gracefully
  const doc = typeof projectAnalysis.toObject === 'function' 
    ? projectAnalysis.toObject() 
    : projectAnalysis;

  const limitations = Array.isArray(doc.analysisMetadata?.limitations)
    ? [...doc.analysisMetadata.limitations]
    : [];

  // Prepend contextual guidance
  limitations.unshift(
    "Contextual Guidance: This analysis is based ONLY on a subset of retrieved files. Absence of evidence here does not prove a feature or technology does not exist in the full repository."
  );

  let evidenceCounter = 1;
  const getId = () => `ev_${String(evidenceCounter++).padStart(3, '0')}`;

  // Deterministic Traversal Order for evidenceIds
  const languages = mapNamedItems(doc.summary?.languages, getId);
  const frameworks = mapNamedItems(doc.summary?.frameworks, getId);
  const libraries = mapNamedItems(doc.summary?.libraries, getId);
  const directories = mapPathItems(doc.structure?.directories, getId);
  const importantFiles = mapPathItems(doc.structure?.importantFiles, getId);
  const entryPoints = mapPathItems(doc.structure?.entryPoints, getId);
  const manifests = mapPathItems(doc.dependencies?.manifests, getId);
  const packages = mapPackageItems(doc.dependencies?.packages, getId);
  const api = mapIndicators(doc.api?.indicators, getId);
  const database = mapIndicators(doc.database?.indicators, getId);
  const authentication = mapIndicators(doc.authentication?.indicators, getId);
  const testing = mapIndicators(doc.testing?.indicators, getId);
  const documentation = mapIndicators(doc.documentation?.indicators, getId);
  const deployment = mapIndicators(doc.deployment?.indicators, getId);

  return {
    repository: {
      fullName: doc.repository?.fullName ?? '',
      defaultBranch: doc.repository?.defaultBranch ?? ''
    },
    analysis_limitations: limitations,
    technical_evidence: {
      summary: { languages, frameworks, libraries },
      structure: { directories, importantFiles, entryPoints },
      dependencies: { manifests, packages },
      indicators: { api, database, authentication, testing, documentation, deployment }
    }
  };
};
