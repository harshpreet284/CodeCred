import { generateText } from './geminiService.js';
import { buildAIContext } from './contextBuilder.js';
import { validateQuestions } from './questionValidator.js';
import { AppError } from '../../utils/AppError.js';

const SYSTEM_INSTRUCTION = `
You are a senior technical interviewer.
Your goal is to generate exactly 3 to 5 distinct, highly relevant interview questions based ONLY on the provided repository context.

Output strictly valid JSON matching this schema:
{
  "questions": [
    {
      "category": "architecture|implementation|database|api|security|testing|deployment|ecosystem",
      "difficulty": "beginner|intermediate|advanced",
      "text": "The question text",
      "technicalEntities": ["Express", "Redis"],
      "targetEvidenceRefs": ["ev_001"]
    }
  ]
}

Rules:
1. DO NOT invent technologies or assume features that are not in the context.
2. YOU MUST supply exactly 3 to 5 questions.
3. Every question must reference at least one valid evidenceId from the context in 'targetEvidenceRefs'.
4. You MUST declare all substantive technologies, libraries, or frameworks used in the question in the 'technicalEntities' array. If none are used, return [].
5. Do not include duplicate questions or heavily overlapping topics.
6. Do not generate question IDs.
7. Only output valid JSON.
`;

const generateQuestionsWithRetry = async (contextString, maxRetries = 1) => {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    attempt++;
    let responseText;
    
    try {
      responseText = await generateText(
        `<REPOSITORY_EVIDENCE>\n${contextString}\n</REPOSITORY_EVIDENCE>`,
        {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json'
        }
      );
    } catch (error) {
      // Transient provider failure (e.g. 500/429)
      if (attempt <= maxRetries) {
        continue;
      }
      throw new AppError('Gemini API failure', 502, 'AI_GENERATION_FAILED');
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
      throw new AppError('Malformed Gemini output', 502, 'AI_GENERATION_FAILED');
    }
  }
};

export const generateInterviewQuestions = async (projectAnalysis) => {
  // 1. Build the AI Context (injects evidenceIds)
  const aiContext = buildAIContext(projectAnalysis);
  const contextString = JSON.stringify(aiContext, null, 2);

  // 2. Generate questions with Gemini (handles Transient/Schema retries)
  const rawQuestions = await generateQuestionsWithRetry(contextString, 1);

  // 3. Rigid validation pipeline (Grounding failures throw without retry)
  const validatedQuestions = validateQuestions(rawQuestions, aiContext);

  return validatedQuestions;
};
