import { Router } from 'express';
import { analyzeProject, getProjectAnalysis } from '../controllers/projectController.js';

const router = Router();

router.post('/analyze', analyzeProject);
router.get('/:analysisId', getProjectAnalysis);

export default router;
