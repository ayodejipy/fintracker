import type { ApiErrorCode, H3ErrorResponse } from '~/types'

/**
 * Utility to check if an error is a structured H3 error
 */
export function isH3Error(error: any): error is H3ErrorResponse {
  return (
    error
    && typeof error === 'object'
    && 'statusCode' in error
    && 'statusMessage' in error
  )
}

/**
 * Check if error is a password-required error
 */
export function isPasswordRequiredError(error: any): boolean {
  if (isH3Error(error)) {
    return error.statusCode === 401 && error.statusMessage === 'PASSWORD_REQUIRED'
  }
  return false
}

/**
 * Check if error is an incorrect password error
 */
export function isPasswordIncorrectError(error: any): boolean {
  if (isH3Error(error)) {
    return error.statusCode === 401 && error.statusMessage === 'PASSWORD_INCORRECT'
  }
  return false
}

/**
 * Extract user-friendly error message from various error formats
 */
export function extractErrorMessage(error: any, fallback = 'An unexpected error occurred'): string {
  // H3 error with data.message
  if (isH3Error(error) && error.data?.message) {
    return error.data.message
  }

  // H3 error with message
  if (isH3Error(error) && error.message) {
    return error.message
  }

  // Regular error with message
  if (error?.message && typeof error.message === 'string') {
    // Clean up verbose error messages - get first line only
    return error.message.split('\n')[0]
  }

  return fallback
}

/**
 * Get error code from error object
 */
export function getErrorCode(error: any): ApiErrorCode | undefined {
  if (isH3Error(error)) {
    return error.statusMessage as ApiErrorCode
  }
  return undefined
}

/**
 * Create a standardized error response for composables
 */
export interface StandardErrorResult {
  success: false
  error: string
  statusCode?: number
  statusMessage?: ApiErrorCode
  requiresPassword?: boolean
  [key: string]: any
}

/**
 * Create a standardized success response for composables
 */
export interface StandardSuccessResult<T = any> {
  success: true
  data?: T
  message?: string
  [key: string]: any
}

export type StandardResult<T = any> = StandardSuccessResult<T> | StandardErrorResult

/**
 * Parse and normalize error into a standard error result
 */
export function parseError(error: any, options?: {
  fallbackMessage?: string
  includeStatusCode?: boolean
}): StandardErrorResult {
  const {
    fallbackMessage = 'An unexpected error occurred',
    includeStatusCode = true,
  } = options || {}

  const errorMessage = extractErrorMessage(error, fallbackMessage)
  const errorCode = getErrorCode(error)

  const result: StandardErrorResult = {
    success: false,
    error: errorMessage,
  }

  if (includeStatusCode && isH3Error(error)) {
    result.statusCode = error.statusCode
  }

  if (errorCode) {
    result.statusMessage = errorCode
  }

  // Add password-specific flags
  if (isPasswordRequiredError(error) || isPasswordIncorrectError(error)) {
    result.requiresPassword = true
  }

  return result
}

/**
 * Handle API errors consistently across the application
 */
export function handleApiError(error: any, context?: string): StandardErrorResult {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error)

  // Check for specific error types
  if (isPasswordRequiredError(error)) {
    return {
      success: false,
      error: extractErrorMessage(error, 'This PDF is password protected. Please provide the password.'),
      requiresPassword: true,
      statusCode: 401,
      statusMessage: 'PASSWORD_REQUIRED',
    }
  }

  if (isPasswordIncorrectError(error)) {
    return {
      success: false,
      error: extractErrorMessage(error, 'Incorrect password. Please try again.'),
      requiresPassword: true,
      statusCode: 401,
      statusMessage: 'PASSWORD_INCORRECT',
    }
  }

  // Generic error handling
  return parseError(error, {
    fallbackMessage: context ? `Failed to ${context}` : undefined,
  })
}
