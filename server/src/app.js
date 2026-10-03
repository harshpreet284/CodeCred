import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env.js';
import healthRouter from './routes/health.js';
import projectsRouter from './routes/projects.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

app.set('trust proxy', 1);

// Apply security headers
app.use(helmet());

// Apply environment-aware CORS
app.use(cors({
  origin: config.clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Parse incoming JSON requests with strict limits
app.use(express.json({ limit: '100kb' }));

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/projects', projectsRouter);

// Catch-all 404 handler for unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
