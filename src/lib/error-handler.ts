/**
 * Centralized error handling utilities
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ERROR_MESSAGES } from './constants';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND, code?: string) {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED, code?: string) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN, code?: string) {
    super(message, 403, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: Error | AppError | string,
  statusCode: number = 500,
  includeStack: boolean = false
): NextResponse<ErrorResponse> {
  let message: string;
  let code: string | undefined;
  let details: any;

  if (error instanceof AppError) {
    message = error.message;
    statusCode = error.statusCode;
    code = error.code;
    details = includeStack ? error.stack : undefined;
  } else if (error instanceof Error) {
    message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;
    details = includeStack ? error.stack : undefined;
  } else {
    message = error || ERROR_MESSAGES.INTERNAL_ERROR;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', { message, code, statusCode, details });
  } else {
    logger.warn('Client error', { message, code, statusCode });
  }

  const response: ErrorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (code) {
    response.code = code;
  }

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle async route errors
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return createErrorResponse(error);
      }

      // Log unexpected errors
      logger.error('Unexpected error in route handler', error);
      
      return createErrorResponse(
        ERROR_MESSAGES.INTERNAL_ERROR,
        500,
        process.env.NODE_ENV === 'development'
      );
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      'MISSING_FIELDS'
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'INVALID_EMAIL');
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): void {
  if (password.length < 6) {
    throw new ValidationError(
      'Password must be at least 6 characters long',
      'WEAK_PASSWORD'
    );
  }
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any): never {
  logger.error('Database error', error);

  if (error.code === 'P2002') {
    throw new ConflictError('Resource already exists', 'DUPLICATE_ENTRY');
  }

  if (error.code === 'P2025') {
    throw new NotFoundError('Resource not found', 'NOT_FOUND');
  }

  throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
}

/**
 * Safe async wrapper for non-critical operations
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorMessage?: string
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    logger.warn(errorMessage || 'Non-critical operation failed', error);
    return fallback;
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Operation failed, retrying in ${delay}ms`, { 
        attempt, 
        maxRetries, 
        error: error instanceof Error ? error.message : error 
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
