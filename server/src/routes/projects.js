import { Router } from 'express';
import { analyzeProject, getProjectAnalysis, generateQuestions, evaluateAnswers } from '../controllers/projectController.js';

const router = Router();

router.post('/analyze', analyzeProject);
router.get('/:analysisId', getProjectAnalysis);

router.post('/:analysisId/questions', generateQuestions);
router.post('/:analysisId/evaluate', evaluateAnswers);

export default router;
