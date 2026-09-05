import { sendError } from '../utils/apiResponse.js';
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Catch Express body-parser JSON syntax errors
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON payload';
    code = 'INVALID_JSON';
  }

  // Protect internal details in production
  if (!err.isOperational && config.nodeEnv === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
    code = 'INTERNAL_ERROR';
  } else if (!err.isOperational) {
    // In dev, log unexpected errors to console
    console.error('[Unhandled Error]', err);
  }

  sendError(res, message, code, statusCode);
};
