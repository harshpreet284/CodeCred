export class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    // Identifies errors we generated vs unexpected internal crashes
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
