import { Router } from 'express';
import { analyzeProject, getProjectAnalysis, generateQuestions } from '../controllers/projectController.js';

const router = Router();

router.post('/analyze', analyzeProject);
router.get('/:analysisId', getProjectAnalysis);

router.post('/:analysisId/questions', generateQuestions);

export default router;
