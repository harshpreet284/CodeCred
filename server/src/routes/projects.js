import { Router } from 'express';
import { analyzeProject, getProjectAnalysis, createInterview, getInterview, evaluateInterview } from '../controllers/projectController.js';
import { aiEndpointLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/analyze', aiEndpointLimiter, analyzeProject);
router.get('/:analysisId', getProjectAnalysis);

router.post('/:analysisId/interviews', aiEndpointLimiter, createInterview);
router.get('/:analysisId/interviews/:sessionId', getInterview);
router.post('/:analysisId/interviews/:sessionId/evaluate', aiEndpointLimiter, evaluateInterview);

export default router;
