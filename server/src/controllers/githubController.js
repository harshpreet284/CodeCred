import { sendSuccess } from '../utils/apiResponse.js';
import { parseGitHubUrl } from '../utils/githubParser.js';
import { getRepository } from '../services/githubService.js';
import { AppError } from '../utils/AppError.js';

export const fetchRepository = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      throw new AppError('GitHub repository URL is required', 400, 'INVALID_INPUT');
    }

    const { owner, repo } = parseGitHubUrl(url);
    
    const repositoryData = await getRepository(owner, repo);
    
    sendSuccess(res, repositoryData, 'Repository successfully retrieved');
  } catch (error) {
    next(error);
  }
};
