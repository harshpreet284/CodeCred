import { Router } from 'express';
import { analyzeProject } from '../controllers/projectController.js';

const router = Router();

router.post('/analyze', analyzeProject);

export default router;
