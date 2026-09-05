import express from 'express';
import healthRouter from './routes/health.js';
import githubRouter from './routes/github.js';
import projectsRouter from './routes/projects.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Parse incoming JSON requests
app.use(express.json());

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/github', githubRouter);
app.use('/api/projects', projectsRouter);

// Catch-all 404 handler for unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
