/**
 * Validation utilities
 */

import { VALIDATION } from './constants';
import { ValidationError } from './error-handler';

// Common validation patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s\-\(\)]{10,}$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value.length < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min} characters long`,
      'MIN_LENGTH'
    );
  }

  if (max !== undefined && value.length > max) {
    throw new ValidationError(
      `${fieldName} must be no more than ${max} characters long`,
      'MAX_LENGTH'
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'REQUIRED_FIELD');
  }

  if (!PATTERNS.EMAIL.test(email.trim())) {
    throw new ValidationError('Invalid email format', 'INVALID_EMAIL');
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required', 'REQUIRED_FIELD');
  }

  validateStringLength(
    password,
    'Password',
    VALIDATION.MIN_PASSWORD_LENGTH,
    VALIDATION.MAX_PASSWORD_LENGTH
  );

  // Additional password strength checks can be added here
  if (!/[a-zA-Z]/.test(password)) {
    throw new ValidationError(
      'Password must contain at least one letter',
      'WEAK_PASSWORD'
    );
  }
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): void {
  if (!phone || typeof phone !== 'string') {
    throw new ValidationError('Phone number is required', 'REQUIRED_FIELD');
  }

  if (!PATTERNS.PHONE.test(phone.trim())) {
    throw new ValidationError('Invalid phone number format', 'INVALID_PHONE');
  }
}

/**
 * Validate URL
 */
export function validateUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL is required', 'REQUIRED_FIELD');
  }

  if (!PATTERNS.URL.test(url.trim())) {
    throw new ValidationError('Invalid URL format', 'INVALID_URL');
  }
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, 'INVALID_NUMBER');
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min}`,
      'MIN_VALUE'
    );
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(
      `${fieldName} must be no more than ${max}`,
      'MAX_VALUE'
    );
  }
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number, fieldName: string): void {
  validateNumberRange(value, fieldName, 0.01);
}

/**
 * Validate integer
 */
export function validateInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} must be an integer`, 'INVALID_INTEGER');
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      'MISSING_FIELDS'
    );
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  enumValues: readonly T[],
  fieldName: string
): asserts value is T {
  if (!enumValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${enumValues.join(', ')}`,
      'INVALID_ENUM'
    );
  }
}

/**
 * Validate array
 */
export function validateArray(
  value: any,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, 'INVALID_ARRAY');
  }

  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must have at least ${minLength} items`,
      'MIN_ARRAY_LENGTH'
    );
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must have no more than ${maxLength} items`,
      'MAX_ARRAY_LENGTH'
    );
  }
}

/**
 * Validate UUID
 */
export function validateUuid(value: string, fieldName: string): void {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required`, 'REQUIRED_FIELD');
  }

  if (!PATTERNS.UUID.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`, 'INVALID_UUID');
  }
}

/**
 * Validate slug
 */
export function validateSlug(value: string, fieldName: string): void {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required`, 'REQUIRED_FIELD');
  }

  if (!PATTERNS.SLUG.test(value)) {
    throw new ValidationError(
      `${fieldName} must be a valid slug (lowercase letters, numbers, and hyphens only)`,
      'INVALID_SLUG'
    );
  }
}

/**
 * Validate date
 */
export function validateDate(value: any, fieldName: string): Date {
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`, 'INVALID_DATE');
  }

  return date;
}

/**
 * Validate future date
 */
export function validateFutureDate(value: any, fieldName: string): Date {
  const date = validateDate(value, fieldName);
  
  if (date <= new Date()) {
    throw new ValidationError(`${fieldName} must be in the future`, 'INVALID_FUTURE_DATE');
  }

  return date;
}

/**
 * Sanitize string input
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    throw new ValidationError('Search query is required', 'REQUIRED_FIELD');
  }

  const sanitized = sanitizeString(query);
  
  validateStringLength(
    sanitized,
    'Search query',
    VALIDATION.MIN_SEARCH_QUERY_LENGTH,
    VALIDATION.MAX_SEARCH_QUERY_LENGTH
  );

  return sanitized;
}
