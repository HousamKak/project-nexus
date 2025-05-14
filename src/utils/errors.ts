// src/utils/errors.ts

/**
 * Base custom error class for Project Nexus
 */
export class NexusError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: any;

  constructor(message: string, code: string, context?: any) {
    super(message);
    this.name = 'NexusError';
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for invalid data
 */
export class ValidationError extends NexusError {
  public readonly field: string;
  public readonly value: any;

  constructor(field: string, value: any, message: string) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Storage error for database operations
 */
export class StorageError extends NexusError {
  public readonly operation: string;

  constructor(operation: string, message: string, context?: any) {
    super(message, 'STORAGE_ERROR', { operation, ...context });
    this.name = 'StorageError';
    this.operation = operation;
  }
}

/**
 * File system error
 */
export class FileSystemError extends NexusError {
  public readonly path: string;

  constructor(path: string, message: string, context?: any) {
    super(message, 'FILESYSTEM_ERROR', { path, ...context });
    this.name = 'FileSystemError';
    this.path = path;
  }
}

/**
 * Network error for external operations
 */
export class NetworkError extends NexusError {
  public readonly url: string;
  public readonly status?: number;

  constructor(url: string, message: string, status?: number, context?: any) {
    super(message, 'NETWORK_ERROR', { url, status, ...context });
    this.name = 'NetworkError';
    this.url = url;
    this.status = status;
  }
}

/**
 * Permission error for unauthorized operations
 */
export class PermissionError extends NexusError {
  public readonly resource: string;
  public readonly action: string;

  constructor(resource: string, action: string, message: string) {
    super(message, 'PERMISSION_ERROR', { resource, action });
    this.name = 'PermissionError';
    this.resource = resource;
    this.action = action;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends NexusError {
  public readonly setting: string;

  constructor(setting: string, message: string, context?: any) {
    super(message, 'CONFIGURATION_ERROR', { setting, ...context });
    this.name = 'ConfigurationError';
    this.setting = setting;
  }
}

/**
 * Theme error
 */
export class ThemeError extends NexusError {
  public readonly themeId: string;

  constructor(themeId: string, message: string, context?: any) {
    super(message, 'THEME_ERROR', { themeId, ...context });
    this.name = 'ThemeError';
    this.themeId = themeId;
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  private static readonly ERROR_MESSAGES = {
    VALIDATION_ERROR: 'Invalid data provided',
    STORAGE_ERROR: 'Database operation failed',
    FILESYSTEM_ERROR: 'File system operation failed',
    NETWORK_ERROR: 'Network request failed',
    PERMISSION_ERROR: 'Permission denied',
    CONFIGURATION_ERROR: 'Configuration error',
    THEME_ERROR: 'Theme error',
    UNKNOWN_ERROR: 'An unexpected error occurred'
  };

  /**
   * Handle error and return user-friendly message
   */
  public static handle(error: Error): string {
    console.error('Error caught:', error);

    if (error instanceof NexusError) {
      return this.formatNexusError(error);
    }

    return this.formatGenericError(error);
  }

  /**
   * Format Nexus error for display
   */
  private static formatNexusError(error: NexusError): string {
    const baseMessage = this.ERROR_MESSAGES[error.code] || error.message;

    switch (error.code) {
      case 'VALIDATION_ERROR':
        const validationError = error as ValidationError;
        return `${baseMessage}: ${validationError.field} - ${error.message}`;

      case 'STORAGE_ERROR':
        const storageError = error as StorageError;
        return `${baseMessage}: ${storageError.operation} - ${error.message}`;

      case 'FILESYSTEM_ERROR':
        const fileError = error as FileSystemError;
        return `${baseMessage}: ${fileError.path} - ${error.message}`;

      case 'NETWORK_ERROR':
        const networkError = error as NetworkError;
        return `${baseMessage}: ${networkError.url} - ${error.message}`;

      case 'PERMISSION_ERROR':
        const permissionError = error as PermissionError;
        return `${baseMessage}: ${permissionError.resource} - ${error.message}`;

      default:
        return error.message;
    }
  }

  /**
   * Format generic error for display
   */
  private static formatGenericError(error: Error): string {
    return `${this.ERROR_MESSAGES.UNKNOWN_ERROR}: ${error.message}`;
  }

  /**
   * Log error with context
   */
  public static log(error: Error, context?: any): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    };

    if (error instanceof NexusError) {
      errorInfo['code'] = error.code;
      errorInfo['nexusContext'] = error.context;
    }

    console.error('Error logged:', errorInfo);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production' && window['errorReporter']) {
      window['errorReporter'].logError(errorInfo);
    }
  }

  /**
   * Show error notification to user
   */
  public static notify(error: Error, type: 'error' | 'warning' = 'error'): void {
    const message = this.handle(error);
    
    // Dispatch custom event for toast notification
    window.dispatchEvent(new CustomEvent('showNotification', {
      detail: {
        message,
        type,
        duration: 5000
      }
    }));
  }

  /**
   * Wrap async function with error handling
   */
  public static async wrap<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.log(error, { context });
      this.notify(error as Error);
      return null;
    }
  }

  /**
   * Create error boundary for components
   */
  public static boundary<T extends (...args: any[]) => any>(
    fn: T,
    context?: string
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.catch((error: Error) => {
            this.log(error, { context, args });
            this.notify(error);
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        this.log(error as Error, { context, args });
        this.notify(error as Error);
        throw error;
      }
    }) as T;
  }
}

/**
 * Error retry utility
 */
export class RetryHandler {
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_DELAY = 1000;
  private static readonly DEFAULT_BACKOFF = 2;

  /**
   * Retry async operation with exponential backoff
   */
  public static async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries || this.DEFAULT_MAX_RETRIES;
    const delay = options.delay || this.DEFAULT_DELAY;
    const backoff = options.backoff || this.DEFAULT_BACKOFF;
    const shouldRetry = options.shouldRetry || ((error: Error) => true);

    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries || !shouldRetry(lastError)) {
          throw lastError;
        }
        
        const waitTime = delay * Math.pow(backoff, attempt);
        await this.sleep(waitTime);
      }
    }
    
    throw lastError!;
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Retry options interface
 */
interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: number;
  shouldRetry?: (error: Error) => boolean;
}