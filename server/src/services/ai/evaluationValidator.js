import { AppError } from '../../utils/AppError.js';

/**
 * Validates the untrusted sessionData array from the client.
 * Performs deterministic structural and evidence-reference validation.
 * @param {Array} sessionData - Array of { question, answer } objects
 * @param {Object} aiContext - The generated AI context to verify evidence refs
 */
export const validateSessionData = (sessionData, aiContext) => {
  // Collect all valid evidence IDs from aiContext for fast lookup
  const validEvidenceIds = new Set();
  
  const collectEvidenceIds = (obj) => {
    if (!obj) return;
    if (typeof obj === 'object') {
      if (obj.evidenceId) {
        validEvidenceIds.add(obj.evidenceId);
      }
      Object.values(obj).forEach(collectEvidenceIds);
    }
  };
  collectEvidenceIds(aiContext.technical_evidence);

  for (let i = 0; i < sessionData.length; i++) {
    const item = sessionData[i];
    
    if (!item || typeof item !== 'object') {
      throw new AppError(`Item at index ${i} is malformed`, 400, 'INVALID_INPUT');
    }

    const { question, answer } = item;

    if (!question || typeof question !== 'object') {
      throw new AppError(`Question is missing at index ${i}`, 400, 'INVALID_INPUT');
    }

    if (!question.id || typeof question.id !== 'string') {
      throw new AppError(`Question ID is missing or invalid at index ${i}`, 400, 'INVALID_INPUT');
    }

    if (!question.text || typeof question.text !== 'string') {
      throw new AppError(`Question text is missing or invalid for question ${question.id}`, 400, 'INVALID_INPUT');
    }

    if (!question.targetEvidenceRefs || !Array.isArray(question.targetEvidenceRefs)) {
      throw new AppError(`targetEvidenceRefs must be an array for question ${question.id}`, 400, 'INVALID_INPUT');
    }
    
    if (question.targetEvidenceRefs.length === 0) {
      throw new AppError(`Question ${question.id} must have at least one targetEvidenceRef`, 400, 'INVALID_INPUT');
    }

    // Evidence consistency check: do refs exist?
    for (const ref of question.targetEvidenceRefs) {
      if (!validEvidenceIds.has(ref)) {
        throw new AppError(`Invalid evidence reference '${ref}' for question ${question.id}`, 400, 'INVALID_INPUT');
      }
    }

    if (answer === undefined || typeof answer !== 'string') {
      throw new AppError(`Answer must be a string for question ${question.id}`, 400, 'INVALID_INPUT');
    }

    if (answer.trim() === '') {
      throw new AppError(`Blank answer provided for question ${question.id}`, 400, 'INVALID_INPUT');
    }
  }
};

/**
 * Validates the Gemini structured evaluation output and enforces strict 1:1 questionId mapping.
 * @param {Object} rawEvaluations - Parsed Gemini JSON
 * @param {Array} sessionData - Original requested sessionData
 * @returns {Array} - The strictly ordered evaluations
 */
export const validateGeminiEvaluations = (rawEvaluations, sessionData) => {
  if (!rawEvaluations || !Array.isArray(rawEvaluations)) {
    throw new AppError('Gemini output must contain an evaluations array', 502, 'AI_GENERATION_FAILED');
  }

  const requestedIds = sessionData.map(item => item.question.id);
  const requestedIdSet = new Set(requestedIds);
  
  if (rawEvaluations.length !== requestedIds.length) {
    throw new AppError('Grounding failure: Incorrect number of evaluations returned', 502, 'AI_GROUNDING_FAILED');
  }

  const evaluationMap = new Map();

  for (const evalItem of rawEvaluations) {
    if (!evalItem || typeof evalItem !== 'object') {
      throw new AppError('Malformed evaluation item in Gemini output', 502, 'AI_GENERATION_FAILED');
    }

    const { questionId, isCorrect, completeness, feedback, unsupportedClaims } = evalItem;

    if (!questionId || typeof questionId !== 'string') {
      throw new AppError('Evaluation item missing questionId', 502, 'AI_GENERATION_FAILED');
    }

    if (!requestedIdSet.has(questionId)) {
      throw new AppError(`Grounding failure: Unknown questionId returned '${questionId}'`, 502, 'AI_GROUNDING_FAILED');
    }

    if (evaluationMap.has(questionId)) {
      throw new AppError(`Grounding failure: Duplicate evaluation for questionId '${questionId}'`, 502, 'AI_GROUNDING_FAILED');
    }

    if (typeof isCorrect !== 'boolean') {
      throw new AppError(`Evaluation ${questionId} missing or invalid isCorrect boolean`, 502, 'AI_GENERATION_FAILED');
    }

    if (!['incomplete', 'partial', 'complete'].includes(completeness)) {
      throw new AppError(`Evaluation ${questionId} has invalid completeness value`, 502, 'AI_GENERATION_FAILED');
    }

    if (!feedback || typeof feedback !== 'string') {
      throw new AppError(`Evaluation ${questionId} missing or invalid feedback string`, 502, 'AI_GENERATION_FAILED');
    }

    if (!Array.isArray(unsupportedClaims) || !unsupportedClaims.every(c => typeof c === 'string')) {
      throw new AppError(`Evaluation ${questionId} missing or invalid unsupportedClaims array`, 502, 'AI_GENERATION_FAILED');
    }

    evaluationMap.set(questionId, {
      questionId,
      isCorrect,
      completeness,
      feedback,
      unsupportedClaims
    });
  }

  // Restore requested order
  const orderedEvaluations = requestedIds.map(id => evaluationMap.get(id));

  return orderedEvaluations;
};
