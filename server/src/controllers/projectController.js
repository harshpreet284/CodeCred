import { sendSuccess } from '../utils/apiResponse.js';
import { analyzeRepository, getAnalysis } from '../services/projectWorkflowService.js';
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
