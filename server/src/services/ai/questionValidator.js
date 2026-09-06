import { AppError } from '../../utils/AppError.js';

const VALID_CATEGORIES = [
  'architecture', 'implementation', 'database', 'api', 
  'security', 'testing', 'deployment', 'ecosystem'
];

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const GENERIC_WHITELIST = new Set(['api', 'http', 'https', 'json', 'url', 'uri', 'ui', 'ux']);

// --- Helpers ---

// Normalize punctuation to spaces for deterministic word boundary matching
const normalizeToWords = (str) => {
  return (str || '').replace(/[^a-zA-Z0-9.+]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
};

const textContainsEntity = (text, entity) => {
  const normalizedText = normalizeToWords(text);
  const normalizedEntity = normalizeToWords(entity);
  if (!normalizedEntity) return false;
  
  const paddedText = ` ${normalizedText} `;
  const paddedEntity = ` ${normalizedEntity} `;
  return paddedText.includes(paddedEntity);
};

const extractExactEntities = (evidence) => {
  if (!evidence) return [];
  const entities = [];
  if (evidence.name) entities.push(evidence.name.toLowerCase());
  if (evidence.type) entities.push(evidence.type.toLowerCase());
  if (evidence.path) {
    const basename = evidence.path.split(/[/\\]/).pop();
    entities.push(basename.toLowerCase());
  }
  return entities;
};

const extractTokens = (text) => {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
};

const extractTokensFromEvidence = (evidence) => {
  if (!evidence) return [];
  const tokens = [];
  if (evidence.name) tokens.push(...extractTokens(evidence.name));
  if (evidence.type) tokens.push(...extractTokens(evidence.type));
  if (evidence.path) tokens.push(...extractTokens(evidence.path));
  return tokens;
};

const extractSuspectEntities = (text, globalVocab) => {
  const suspects = new Set();
  
  // 1. Backticks
  const backtickRegex = /`([^`]+)`/g;
  let match;
  while ((match = backtickRegex.exec(text)) !== null) {
    suspects.add(match[1]);
  }

  // 2 & 3. CamelCase and known global vocabulary
  // Split raw text into words (keep case, preserve dots/pluses for tech names like Vue.js or C++)
  const words = text.split(/[^a-zA-Z0-9.+_]+/);
  
  for (const word of words) {
    if (!word) continue;

    // CamelCase / PascalCase check (contains lowercase followed by uppercase)
    if (/[a-z][A-Z]/.test(word)) {
      suspects.add(word);
    }

    // Global vocabulary check
    if (globalVocab.has(word.toLowerCase())) {
      suspects.add(word);
    }
  }

  // Filter whitelist
  const finalSuspects = new Set();
  for (const suspect of suspects) {
    const normalized = suspect.toLowerCase();
    if (!GENERIC_WHITELIST.has(normalized)) {
      finalSuspects.add(normalized);
    }
  }
  return finalSuspects;
};

// Traverses context to build an evidence map and a global vocabulary Set.
const buildContextMaps = (context) => {
  const evidenceMap = new Map();
  const globalVocab = new Set();
  
  const addItems = (items) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item.evidenceId) {
        evidenceMap.set(item.evidenceId, item);
        extractExactEntities(item).forEach(t => globalVocab.add(t));
      }
    }
  };

  const ev = context.technical_evidence || {};
  if (ev.summary) {
    addItems(ev.summary.languages); addItems(ev.summary.frameworks); addItems(ev.summary.libraries);
  }
  if (ev.structure) {
    addItems(ev.structure.directories); addItems(ev.structure.importantFiles); addItems(ev.structure.entryPoints);
  }
  if (ev.dependencies) {
    addItems(ev.dependencies.manifests); addItems(ev.dependencies.packages);
  }
  if (ev.indicators) {
    addItems(ev.indicators.api); addItems(ev.indicators.database); addItems(ev.indicators.authentication);
    addItems(ev.indicators.testing); addItems(ev.indicators.documentation); addItems(ev.indicators.deployment);
  }

  return { evidenceMap, globalVocab };
};

// --- Main Validation Pipeline ---

export const validateQuestions = (questions, context) => {
  // 1. Output shape validation
  if (!Array.isArray(questions)) {
    throw new AppError('Gemini output must be an array of questions', 502, 'AI_GENERATION_FAILED');
  }
  if (questions.length < 3 || questions.length > 5) {
    throw new AppError(`Expected 3-5 questions, got ${questions.length}`, 502, 'AI_GENERATION_FAILED');
  }

  const { evidenceMap, globalVocab } = buildContextMaps(context);
  const validQuestions = [];

  for (const q of questions) {
    // 2. Question fields validation
    if (!q.category || !VALID_CATEGORIES.includes(q.category)) {
      throw new AppError(`Invalid category: ${q.category}`, 502, 'AI_GENERATION_FAILED');
    }
    if (!q.difficulty || !VALID_DIFFICULTIES.includes(q.difficulty)) {
      throw new AppError(`Invalid difficulty: ${q.difficulty}`, 502, 'AI_GENERATION_FAILED');
    }
    if (!q.text || typeof q.text !== 'string') {
      throw new AppError('Missing question text', 502, 'AI_GENERATION_FAILED');
    }

    // 3. `technicalEntities` runtime shape
    if (!Array.isArray(q.technicalEntities)) {
      throw new AppError('Missing or invalid technicalEntities array', 502, 'GROUNDING_VALIDATION_FAILED');
    }

    // 4. `targetEvidenceRefs` runtime shape
    if (!Array.isArray(q.targetEvidenceRefs) || q.targetEvidenceRefs.length === 0) {
      throw new AppError('Missing or empty targetEvidenceRefs', 502, 'GROUNDING_VALIDATION_FAILED');
    }

    // 5. Declared entity <-> question-text consistency
    for (const entity of q.technicalEntities) {
      if (typeof entity !== 'string') {
        throw new AppError('Technical entity must be a string', 502, 'GROUNDING_VALIDATION_FAILED');
      }
      if (!textContainsEntity(q.text, entity)) {
        throw new AppError(`Declared entity missing from text: ${entity}`, 502, 'GROUNDING_VALIDATION_FAILED');
      }
    }

    // 6. Evidence reference validation
    const uniqueRefs = [...new Set(q.targetEvidenceRefs)];
    const supportedExactEntities = new Set();
    const supportedTokens = new Set();
    
    for (const ref of uniqueRefs) {
      if (!evidenceMap.has(ref)) {
        throw new AppError(`Evidence reference not found: ${ref}`, 502, 'GROUNDING_VALIDATION_FAILED');
      }
      const evItem = evidenceMap.get(ref);
      extractExactEntities(evItem).forEach(t => supportedExactEntities.add(t));
      extractTokensFromEvidence(evItem).forEach(t => supportedTokens.add(t));
    }

    // 7. Declared entity <-> referenced evidence support
    for (const entity of q.technicalEntities) {
      const normalizedEntity = entity.toLowerCase();
      if (!supportedExactEntities.has(normalizedEntity)) {
        throw new AppError(`Declared entity not supported by references: ${entity}`, 502, 'GROUNDING_VALIDATION_FAILED');
      }
    }

    // 8. Defense-in-depth detector
    const suspectEntities = extractSuspectEntities(q.text, globalVocab);
    for (const suspect of suspectEntities) {
      if (!supportedExactEntities.has(suspect)) {
        throw new AppError(`Sanity detector flagged unsupported technical entity: ${suspect}`, 502, 'GROUNDING_VALIDATION_FAILED');
      }
    }

    // 9. V1 Topic Eligibility
    // If no entities declared, ensure the question still has broad token overlap with the references.
    if (q.technicalEntities.length === 0) {
      const questionTokens = new Set(extractTokens(q.text));
      let hasOverlap = false;
      for (const token of questionTokens) {
        if (supportedTokens.has(token) || supportedExactEntities.has(token)) {
          hasOverlap = true;
          break;
        }
      }
      // Special allowance: if they ask about generic structural aspects and evidence includes path indicators,
      // it might fail simple token match. E.g. "How are components structured?" and ev has "src/components".
      // `extractTokens` handles standard tokenization, so "components" matches "components".
      if (!hasOverlap) {
        throw new AppError('Question lacks eligibility overlap with referenced evidence', 502, 'GROUNDING_VALIDATION_FAILED');
      }
    }

    validQuestions.push({
      category: q.category,
      difficulty: q.difficulty,
      text: q.text,
      technicalEntities: q.technicalEntities,
      targetEvidenceRefs: uniqueRefs,
      _tokens: new Set(extractTokens(q.text))
    });
  }

  // 10. Duplicate filtering (Jaccard > 0.70)
  const deduplicated = [];
  for (const q of validQuestions) {
    let isDuplicate = false;
    for (const existing of deduplicated) {
      const intersection = [...q._tokens].filter(t => existing._tokens.has(t)).length;
      const union = new Set([...q._tokens, ...existing._tokens]).size;
      if (union > 0 && intersection / union > 0.70) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      deduplicated.push(q);
    }
  }

  // Final 3-5 requirement
  if (deduplicated.length < 3) {
    throw new AppError('Batch filtered below 3 valid questions due to duplicates', 502, 'AI_GENERATION_FAILED');
  }

  // 11 & 12. Remove internal metadata & assign deterministic backend IDs
  let idCounter = 1;
  return deduplicated.map(q => {
    const { _tokens, ...rest } = q;
    return {
      id: `q_${String(idCounter++).padStart(3, '0')}`,
      ...rest
    };
  });
};
