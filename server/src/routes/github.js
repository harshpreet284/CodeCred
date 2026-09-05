import { Router } from 'express';
import { fetchRepository } from '../controllers/githubController.js';

const router = Router();

router.post('/repository', fetchRepository);

export default router;
