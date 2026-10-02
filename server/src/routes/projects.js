import { Router } from 'express';
import { analyzeProject, getProjectAnalysis, createInterview, getInterview, evaluateInterview } from '../controllers/projectController.js';

const router = Router();

router.post('/analyze', analyzeProject);
router.get('/:analysisId', getProjectAnalysis);

router.post('/:analysisId/interviews', createInterview);
router.get('/:analysisId/interviews/:sessionId', getInterview);
router.post('/:analysisId/interviews/:sessionId/evaluate', evaluateInterview);

export default router;
