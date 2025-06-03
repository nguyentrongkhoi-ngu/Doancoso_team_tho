/**
 * Centralized logging utility
 * Provides consistent logging across the application with environment-aware behavior
 */

import { IS_DEVELOPMENT, IS_PRODUCTION } from './constants';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = IS_DEVELOPMENT;
  private isProduction = IS_PRODUCTION;

  /**
   * Log error messages (always logged in all environments)
   */
  error(message: string, context?: LogContext | Error): void {
    if (context instanceof Error) {
      console.error(`[ERROR] ${message}`, context);
    } else {
      console.error(`[ERROR] ${message}`, context || '');
    }

    // TODO: Integrate with error monitoring service like Sentry in production
    if (this.isProduction) {
      // reportErrorToMonitoringService(message, context);
    }
  }

  /**
   * Log warning messages (logged in development and staging)
   */
  warn(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  /**
   * Log info messages (logged in development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Log debug messages (logged in development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log API requests (development only)
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      console.log(`[API] ${timestamp} - ${method} ${path}`, context || '');
    }
  }

  /**
   * Create a timer for measuring execution time
   */
  timer(label: string): () => void {
    if (!this.isDevelopment) {
      return () => {}; // No-op in production
    }

    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      console.log(`[PERF] ${label}: ${duration}ms`);
    };
  }

  /**
   * Log performance metrics
   */
  performance(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.time(`[PERF] ${label}`);
      callback();
      console.timeEnd(`[PERF] ${label}`);
    } else {
      callback();
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);

export default logger;