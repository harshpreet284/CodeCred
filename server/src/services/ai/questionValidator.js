import { AppError } from '../../utils/AppError.js';

const VALID_CATEGORIES = [
  'architecture', 'implementation', 'database', 'api', 
  'security', 'testing', 'deployment', 'ecosystem'
];

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const extractTokens = (text) => {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
};

export const validateQuestions = (questions, context) => {
  if (!Array.isArray(questions)) {
    throw new AppError('AI provider output must be an array of questions', 502, 'AI_GENERATION_FAILED');
  }
  if (questions.length < 3 || questions.length > 5) {
    throw new AppError(`Expected 3-5 questions, got ${questions.length}`, 502, 'AI_GENERATION_FAILED');
  }

  const validQuestions = [];

  for (const q of questions) {
    if (!q.category || !VALID_CATEGORIES.includes(q.category)) {
      throw new AppError(`Invalid category: ${q.category}`, 502, 'AI_GENERATION_FAILED');
    }
    if (!q.difficulty || !VALID_DIFFICULTIES.includes(q.difficulty)) {
      throw new AppError(`Invalid difficulty: ${q.difficulty}`, 502, 'AI_GENERATION_FAILED');
    }
    if (!q.text || typeof q.text !== 'string') {
      throw new AppError('Missing question text', 502, 'AI_GENERATION_FAILED');
    }

    validQuestions.push({
      category: q.category,
      difficulty: q.difficulty,
      text: q.text,
      _tokens: new Set(extractTokens(q.text))
    });
  }

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

  if (deduplicated.length < 3) {
    throw new AppError('Batch filtered below 3 valid questions due to duplicates', 502, 'AI_GENERATION_FAILED');
  }

  let idCounter = 1;
  return deduplicated.map(q => {
    const { _tokens, ...rest } = q;
    return {
      id: `q_${String(idCounter++).padStart(3, '0')}`,
      ...rest
    };
  });
};

