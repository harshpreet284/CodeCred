import { InterviewSession } from '../models/InterviewSession.js';
import { getAnalysisById } from './projectAnalysisService.js';
import { generateInterviewQuestions } from './ai/questionGenerator.js';
import { evaluateSessionAnswers } from './ai/answerEvaluator.js';
import { AppError } from '../utils/AppError.js';

const toSafeSessionDTO = (session) => {
  return {
    id: session._id,
    analysisId: session.analysisId,
    status: session.status,
    questions: session.questions.map(q => ({
      id: q.id,
      text: q.text,
      category: q.category,
      difficulty: q.difficulty
    })),
    answers: session.answers,
    evaluations: session.evaluations,
    knowledgeGaps: session.knowledgeGaps,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
};

export const createInterviewSession = async (analysisId) => {
  const analysis = await getAnalysisById(analysisId);
  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'NOT_FOUND');
  }

  const questions = await generateInterviewQuestions(analysis);

  const session = new InterviewSession({
    analysisId: analysis._id,
    status: 'in_progress',
    questions: questions
  });

  await session.save();

  return toSafeSessionDTO(session);
};

export const getInterviewSession = async (analysisId, sessionId) => {
  const session = await InterviewSession.findOne({ _id: sessionId, analysisId });
  if (!session) {
    throw new AppError('Interview session not found or mismatch', 404, 'NOT_FOUND');
  }

  return toSafeSessionDTO(session);
};

export const evaluateInterviewSession = async (analysisId, sessionId, sessionData) => {
  const session = await InterviewSession.findOne({ _id: sessionId, analysisId });
  if (!session) {
    throw new AppError('Interview session not found or mismatch', 404, 'NOT_FOUND');
  }

  if (session.status === 'completed') {
    throw new AppError('Session is already completed', 400, 'INVALID_STATE');
  }

  const analysis = await getAnalysisById(analysisId);
  if (!analysis) {
    throw new AppError('Analysis not found', 404, 'NOT_FOUND');
  }

  // Validate sessionData against session.questions and rebuild enriched sessionData for AI
  const enrichedSessionData = [];
  const submittedAnswers = [];
  
  for (const item of sessionData) {
    if (!item.question || !item.question.id || !item.answer) {
      throw new AppError('Malformed sessionData', 400, 'INVALID_INPUT');
    }
    
    const originalQuestion = session.questions.find(q => q.id === item.question.id);
    if (!originalQuestion) {
      throw new AppError(`Question ID ${item.question.id} does not belong to this session`, 400, 'INVALID_INPUT');
    }
    
    submittedAnswers.push({
      questionId: item.question.id,
      answer: item.answer
    });
    
    enrichedSessionData.push({
      question: originalQuestion,
      answer: item.answer
    });
  }

  // Evaluate answers
  const { evaluations, knowledgeGaps } = await evaluateSessionAnswers(analysis, enrichedSessionData);

  // Persist
  session.answers = submittedAnswers;
  session.evaluations = evaluations;
  session.knowledgeGaps = knowledgeGaps;
  session.status = 'completed';

  await session.save();

  return toSafeSessionDTO(session);
};
