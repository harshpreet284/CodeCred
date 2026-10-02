import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';
import { config } from '../config/env.js';

// Handler for when limits are exceeded
const handler = (req, res, next, options) => {
  sendError(res, options.message, 'TOO_MANY_REQUESTS', options.statusCode);
};

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimits.api.windowMs,
  max: () => config.rateLimits.api.max,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: 'Too many requests from this IP, please try again later.',
  handler
});

// Stricter rate limiter for expensive AI endpoints
export const aiEndpointLimiter = rateLimit({
  windowMs: config.rateLimits.ai.windowMs,
  max: () => config.rateLimits.ai.max,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: 'Too many analysis/interview requests from this IP, please try again later.',
  handler
});
