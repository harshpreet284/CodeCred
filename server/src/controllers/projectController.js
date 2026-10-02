import { sendSuccess } from '../utils/apiResponse.js';
import { analyzeRepository, getAnalysis } from '../services/projectWorkflowService.js';
import { generateInterviewQuestions } from '../services/ai/questionGenerator.js';
import { AppError } from '../utils/AppError.js';

export const analyzeProject = async (req, res, next) => {
  try {
    const { repositoryUrl } = req.body;
    
    if (!repositoryUrl) {
      throw new AppError('GitHub repository URL is required', 400, 'INVALID_INPUT');
    }

    const safeResponseData = await analyzeRepository(repositoryUrl);
    
    sendSuccess(res, safeResponseData, 'Analysis completed successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getProjectAnalysis = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      throw new AppError('Analysis ID is required', 400, 'INVALID_INPUT');
    }

    const safeResponseData = await getAnalysis(analysisId);
    
    sendSuccess(res, safeResponseData, 'Analysis retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createInterview = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      throw new AppError('Analysis ID is required', 400, 'INVALID_INPUT');
    }

    const { createInterviewSession } = await import('../services/interviewSessionService.js');
    const session = await createInterviewSession(analysisId);
    
    sendSuccess(res, session, 'Interview session created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (req, res, next) => {
  try {
    const { analysisId, sessionId } = req.params;

    if (!analysisId || !sessionId) {
      throw new AppError('Analysis ID and Session ID are required', 400, 'INVALID_INPUT');
    }

    const { getInterviewSession } = await import('../services/interviewSessionService.js');
    const session = await getInterviewSession(analysisId, sessionId);
    
    sendSuccess(res, session, 'Interview session retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const evaluateInterview = async (req, res, next) => {
  try {
    const { analysisId, sessionId } = req.params;
    
    if (!analysisId || !sessionId) {
      throw new AppError('Analysis ID and Session ID are required', 400, 'INVALID_INPUT');
    }

    const { sessionData } = req.body;
    
    // Request validation happens here and in the validator
    if (!sessionData) {
      throw new AppError('sessionData is required', 400, 'INVALID_INPUT');
    }
    if (!Array.isArray(sessionData)) {
      throw new AppError('sessionData must be an array', 400, 'INVALID_INPUT');
    }
    if (sessionData.length === 0 || sessionData.length > 10) {
      throw new AppError('sessionData array length must be between 1 and 10', 400, 'INVALID_INPUT');
    }

    const { evaluateInterviewSession } = await import('../services/interviewSessionService.js');
    const session = await evaluateInterviewSession(analysisId, sessionId, sessionData);
    
    sendSuccess(res, session, 'Answers evaluated successfully', 200);
  } catch (error) {
    next(error);
  }
};
