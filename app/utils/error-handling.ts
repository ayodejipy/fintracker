import { z } from 'zod'

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  NETWORK = 'network',
  SERVER = 'server',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Base error interface
export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code?: string
  details?: Record<string, any>
  timestamp: Date
  userId?: string
  requestId?: string
  stack?: string
}

// Validation error details
export interface ValidationErrorDetail {
  field: string
  message: string
  value?: any
  code?: string
}

// Custom error classes
export class AppErrorClass extends Error implements AppError {
  type: ErrorType
  severity: ErrorSeverity
  code?: string
  details?: Record<string, any>
  timestamp: Date
  userId?: string
  requestId?: string

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options?: {
      code?: string
      details?: Record<string, any>
      userId?: string
      requestId?: string
      cause?: Error
    },
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.timestamp = new Date()
    this.code = options?.code
    this.details = options?.details
    this.userId = options?.userId
    this.requestId = options?.requestId

    if (options?.cause) {
      this.cause = options.cause
      this.stack = options.cause.stack
    }
  }
}

// Validation error class
export class ValidationError extends AppErrorClass {
  validationErrors: ValidationErrorDetail[]

  constructor(
    message: string,
    validationErrors: ValidationErrorDetail[],
    options?: {
      code?: string
      userId?: string
      requestId?: string
    },
  ) {
    super(ErrorType.VALIDATION, message, ErrorSeverity.LOW, {
      ...options,
      details: { validationErrors },
    })
    this.name = 'ValidationError'
    this.validationErrors = validationErrors
  }
}

// Business logic error class
export class BusinessLogicError extends AppErrorClass {
  constructor(
    message: string,
    options?: {
      code?: string
      details?: Record<string, any>
      userId?: string
      requestId?: string
    },
  ) {
    super(ErrorType.BUSINESS_LOGIC, message, ErrorSeverity.MEDIUM, options)
    this.name = 'BusinessLogicError'
  }
}

// Error factory functions
export function createValidationError(message: string, validationErrors: ValidationErrorDetail[], options?: { code?: string, userId?: string, requestId?: string }): ValidationError {
  return new ValidationError(message, validationErrors, options)
}

export function createBusinessLogicError(message: string, options?: {
  code?: string
  details?: Record<string, unknown>
  userId?: string
  requestId?: string
}): BusinessLogicError {
  return new BusinessLogicError(message, options)
}

// Zod error transformer
export function transformZodError(error: z.ZodError): ValidationError {
  const validationErrors: ValidationErrorDetail[] = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.input,
    code: err.code,
  }))

  return createValidationError(
    'Validation failed',
    validationErrors,
    { code: 'VALIDATION_FAILED' },
  )
}

// Error categorization helper
export function categorizeError(error: unknown): AppError {
  if (error instanceof AppErrorClass) {
    return error
  }

  if (error instanceof z.ZodError) {
    return transformZodError(error)
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new AppErrorClass(
        ErrorType.NETWORK,
        error.message,
        ErrorSeverity.MEDIUM,
        { cause: error },
      )
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('prisma')) {
      return new AppErrorClass(
        ErrorType.DATABASE,
        'Database operation failed',
        ErrorSeverity.HIGH,
        { cause: error },
      )
    }

    // Generic error
    return new AppErrorClass(
      ErrorType.UNKNOWN,
      error.message,
      ErrorSeverity.MEDIUM,
      { cause: error },
    )
  }

  // Unknown error type
  return new AppErrorClass(
    ErrorType.UNKNOWN,
    'An unknown error occurred',
    ErrorSeverity.MEDIUM,
    { details: { originalError: error } },
  )
}

// Error logging helper
export function logError(error: AppError, context?: Record<string, unknown>) {
  const logData = {
    ...error,
    context,
    environment: typeof window === 'undefined' && typeof process !== 'undefined' ? process.env?.NODE_ENV : 'browser',
  }

  // In production, you might want to send this to a logging service
  if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
    console.error('Critical/High severity error:', logData)
  }
  else {
    console.warn('Error occurred:', logData)
  }
}

// User-friendly error messages
export function getUserFriendlyMessage(error: AppError): string {
  const friendlyMessages: Record<ErrorType, string> = {
    [ErrorType.VALIDATION]: 'Please check your input and try again.',
    [ErrorType.AUTHENTICATION]: 'Please log in to continue.',
    [ErrorType.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
    [ErrorType.NOT_FOUND]: 'The requested item could not be found.',
    [ErrorType.NETWORK]: 'Please check your internet connection and try again.',
    [ErrorType.SERVER]: 'Something went wrong on our end. Please try again later.',
    [ErrorType.DATABASE]: 'We\'re having trouble saving your data. Please try again.',
    [ErrorType.BUSINESS_LOGIC]: error.message, // Use the specific message for business logic errors
    [ErrorType.RATE_LIMIT]: 'You\'re doing that too often. Please wait a moment and try again.',
    [ErrorType.UNKNOWN]: 'Something unexpected happened. Please try again.',
  }

  return friendlyMessages[error.type] || friendlyMessages[ErrorType.UNKNOWN]
}

// Error recovery suggestions
export function getRecoverySuggestions(error: AppError): string[] {
  const suggestions: Record<ErrorType, string[]> = {
    [ErrorType.VALIDATION]: [
      'Double-check all required fields are filled',
      'Make sure amounts are positive numbers',
      'Verify dates are in the correct format',
    ],
    [ErrorType.AUTHENTICATION]: [
      'Try logging out and logging back in',
      'Clear your browser cache and cookies',
      'Reset your password if needed',
    ],
    [ErrorType.AUTHORIZATION]: [
      'Contact support if you believe this is an error',
      'Make sure you\'re logged into the correct account',
    ],
    [ErrorType.NOT_FOUND]: [
      'Check if the item was recently deleted',
      'Try refreshing the page',
      'Go back and try again',
    ],
    [ErrorType.NETWORK]: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again',
    ],
    [ErrorType.SERVER]: [
      'Try again in a few minutes',
      'Contact support if the problem persists',
    ],
    [ErrorType.DATABASE]: [
      'Try saving again',
      'Check if you have sufficient storage space',
      'Contact support if the issue continues',
    ],
    [ErrorType.BUSINESS_LOGIC]: [
      'Review the error message for specific guidance',
      'Check your account settings',
      'Contact support for assistance',
    ],
    [ErrorType.RATE_LIMIT]: [
      'Wait a few minutes before trying again',
      'Reduce the frequency of your actions',
    ],
    [ErrorType.UNKNOWN]: [
      'Try refreshing the page',
      'Clear your browser cache',
      'Contact support if the problem persists',
    ],
  }

  return suggestions[error.type] || suggestions[ErrorType.UNKNOWN]
}
