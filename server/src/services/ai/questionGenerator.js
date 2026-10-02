import { generateText } from './aiProvider.js';
import { buildAIContext } from './contextBuilder.js';
import { validateQuestions } from './questionValidator.js';
import { AppError } from '../../utils/AppError.js';

const SYSTEM_INSTRUCTION = `
You are a senior technical interviewer.
Your goal is to generate exactly 3 to 5 distinct, highly relevant interview questions based ONLY on the provided repository Evidence Catalog.

STEP 1:
Select one or more evidence IDs from the provided Evidence Catalog.

STEP 2:
Provide a short factual evidence justification describing the repository concepts directly supported by those selected evidence items.

STEP 3:
Generate the interview question using ONLY concepts directly supported by the selected evidence.

CRITICAL RULE:
Every technical concept, technology, framework, library, protocol, mechanism, or repository-specific term appearing in the question must be supported by at least one selected evidence reference.
Do not introduce a technically related concept merely because it is common knowledge or associated with the repository.
The question must be derived from the selected evidence, not the other way around.
Do not invent evidence IDs.
Do not output technicalEntities.

Output strictly valid JSON matching this schema:
{
  "questions": [
    {
      "targetEvidenceRefs": ["<VALID_EVIDENCE_ID>"],
      "evidenceReasoning": "Concise factual justification of why the evidence supports the question",
      "category": "architecture|implementation|database|api|security|testing|deployment|ecosystem",
      "difficulty": "beginner|intermediate|advanced",
      "text": "The question text derived ONLY from selected evidence"
    }
  ]
}

Rules:
1. DO NOT invent technologies or assume features that are not in the context.
2. YOU MUST supply exactly 3 to 5 questions.
3. Every question must reference at least one valid evidenceId from the context in 'targetEvidenceRefs'.
4. Do not include duplicate questions or heavily overlapping topics.
5. Do not generate question IDs.
6. Only output valid JSON.
`;

const generateQuestionsWithRetry = async (contextString, aiContext, maxRetries = 1) => {
  const validEvidenceIds = [];
  const collectEvidenceIds = (obj) => {
    if (!obj) return;
    if (typeof obj === 'object') {
      if (obj.evidenceId) {
        validEvidenceIds.push(obj.evidenceId);
      }
      Object.values(obj).forEach(collectEvidenceIds);
    }
  };
  collectEvidenceIds(aiContext.technical_evidence);
  
  // JSON Schema requires at least one enum value. If empty, use a placeholder.
  const evidenceEnum = validEvidenceIds.length > 0 ? validEvidenceIds : ['NONE_AVAILABLE'];

  let attempt = 0;
  
  while (attempt <= maxRetries) {
    attempt++;
    let responseText;
    
    try {
      responseText = await generateText(
        `<REPOSITORY_EVIDENCE>\n${contextString}\n</REPOSITORY_EVIDENCE>`,
        {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    targetEvidenceRefs: { 
                      type: "array", 
                      items: { 
                        type: "string",
                        enum: evidenceEnum 
                      } 
                    },
                    evidenceReasoning: { type: "string" },
                    category: { type: "string" },
                    difficulty: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["targetEvidenceRefs", "evidenceReasoning", "category", "difficulty", "text"],
                  additionalProperties: false
                }
              }
            },
            required: ["questions"],
            additionalProperties: false
          }
        }
      );
    } catch (error) {
      // Transient provider failure (e.g. 500/429)
      if (attempt <= maxRetries) {
        continue;
      }
      throw new AppError('AI provider failure', 502, 'AI_GENERATION_FAILED');
    }

    try {
      const parsed = JSON.parse(responseText);
      if (!parsed.questions) {
        throw new Error('Missing questions array');
      }
      return parsed.questions;
    } catch (parseError) {
      // Malformed / Schema failure
      if (attempt <= maxRetries) {
        continue;
      }
      throw new AppError('Malformed AI provider output', 502, 'AI_GENERATION_FAILED');
    }
  }
};

const buildEvidenceCatalog = (aiContext) => {
  const catalog = [];
  
  const processGroup = (group, typePrefix) => {
    if (!group) return;
    Object.entries(group).forEach(([subtype, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.evidenceId) {
            let detail = item.name || item.path || '';
            if (item.version) detail += ` (${item.version})`;
            if (item.type) detail = `${item.type}: ${detail}`;
            
            catalog.push({
              id: item.evidenceId,
              concept: item.name || item.path || item.type || 'unknown',
              type: `${typePrefix}.${subtype}`,
              detail: detail
            });
          }
        });
      }
    });
  };

  if (aiContext.technical_evidence) {
    processGroup(aiContext.technical_evidence.summary, 'summary');
    processGroup(aiContext.technical_evidence.structure, 'structure');
    processGroup(aiContext.technical_evidence.dependencies, 'dependencies');
    processGroup(aiContext.technical_evidence.indicators, 'indicators');
  }

  return catalog;
};

export const generateInterviewQuestions = async (projectAnalysis) => {
  // 1. Build the AI Context (injects evidenceIds)
  const aiContext = buildAIContext(projectAnalysis);
  
  const catalog = buildEvidenceCatalog(aiContext);
  const promptData = {
    repository: aiContext.repository,
    analysis_limitations: aiContext.analysis_limitations,
    evidence_catalog: catalog
  };
  const contextString = JSON.stringify(promptData, null, 2);

  // 2. Generate questions with AI provider (handles Transient/Schema retries)
  const rawQuestions = await generateQuestionsWithRetry(contextString, aiContext, 1);

  // 3. Rigid validation pipeline (Grounding failures throw without retry)
  const validatedQuestions = validateQuestions(rawQuestions, aiContext);

  return validatedQuestions;
};
