import type { H3Event } from 'h3'
import { getHeader, getHeaders, getMethod, getQuery, getRequestURL } from 'h3'
import { z } from 'zod'
import {
  AppErrorClass,
  categorizeError,
  ErrorSeverity,
  ErrorType,
  transformZodError,
  ValidationError,
} from '~/utils/error-handling'

// Server-specific error types
export class DatabaseError extends AppErrorClass {
  constructor(
    message: string,
    options?: {
      code?: string
      details?: Record<string, any>
      cause?: Error
    },
  ) {
    super(ErrorType.DATABASE, message, ErrorSeverity.HIGH, options)
    this.name = 'DatabaseError'
  }
}

export class AuthenticationError extends AppErrorClass {
  constructor(
    message: string = 'Authentication required',
    options?: {
      code?: string
      details?: Record<string, any>
    },
  ) {
    super(ErrorType.AUTHENTICATION, message, ErrorSeverity.MEDIUM, options)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppErrorClass {
  constructor(
    message: string = 'Insufficient permissions',
    options?: {
      code?: string
      details?: Record<string, any>
    },
  ) {
    super(ErrorType.AUTHORIZATION, message, ErrorSeverity.MEDIUM, options)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppErrorClass {
  constructor(
    message: string = 'Resource not found',
    options?: {
      code?: string
      details?: Record<string, any>
    },
  ) {
    super(ErrorType.NOT_FOUND, message, ErrorSeverity.LOW, options)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppErrorClass {
  constructor(
    message: string = 'Rate limit exceeded',
    options?: {
      code?: string
      details?: Record<string, any>
    },
  ) {
    super(ErrorType.RATE_LIMIT, message, ErrorSeverity.MEDIUM, options)
    this.name = 'RateLimitError'
  }
}

// Error response formatter
export function formatErrorResponse(error: AppErrorClass, event: H3Event) {
  // Log error server-side
  console.error('API Error:', {
    type: error.type,
    message: error.message,
    code: error.code,
    severity: error.severity,
    details: error.details,
    url: getRequestURL(event),
    method: getMethod(event),
    userAgent: getHeader(event, 'user-agent'),
    timestamp: error.timestamp,
  })

  // Determine HTTP status code
  const statusCode = getHttpStatusCode(error)

  // Create response body
  const responseBody = {
    error: {
      type: error.type,
      message: error.message,
      code: error.code,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
    },
  }

  // Add validation errors if present
  if (error instanceof ValidationError) {
    (responseBody.error as any).validationErrors = error.validationErrors
  }

  // Don't expose sensitive details in production
  if (process.env.NODE_ENV === 'development') {
    (responseBody.error as any).details = error.details;
    (responseBody.error as any).stack = error.stack
  }

  return { statusCode, body: responseBody }
}

// Map error types to HTTP status codes
function getHttpStatusCode(error: AppErrorClass): number {
  const statusMap: Record<ErrorType, number> = {
    [ErrorType.VALIDATION]: 400,
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.AUTHORIZATION]: 403,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.BUSINESS_LOGIC]: 422,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.DATABASE]: 500,
    [ErrorType.SERVER]: 500,
    [ErrorType.NETWORK]: 502,
    [ErrorType.UNKNOWN]: 500,
  }

  return statusMap[error.type] || 500
}

// Global error handler for API routes
export function handleApiError(error: unknown, event: H3Event) {
  const appError = categorizeError(error)

  // Add request context
  appError.details = {
    ...appError.details,
    url: getRequestURL(event).toString(),
    method: getMethod(event),
    headers: getHeaders(event),
    query: getQuery(event),
  }

  // Add user context if available
  try {
    const user = event.context.user
    if (user) {
      appError.userId = user.id
    }
  }
  catch {
    // User context not available
  }

  const { statusCode, body } = formatErrorResponse(appError as AppErrorClass, event)

  throw createError({
    statusCode,
    statusMessage: appError.message,
    data: body,
  })
}

// Validation middleware
export async function validateRequestBody<T>(schema: z.ZodSchema<T>, event: H3Event): Promise<T> {
  try {
    const body = await readBody(event)
    return schema.parse(body)
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      throw transformZodError(error)
    }
    throw new ValidationError('Invalid request body', [
      { field: 'body', message: 'Request body is invalid' },
    ])
  }
}

// Query parameter validation
export function validateQuery<T>(schema: z.ZodSchema<T>, event: H3Event): T {
  try {
    const query = getQuery(event)
    return schema.parse(query)
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      throw transformZodError(error)
    }
    throw new ValidationError('Invalid query parameters', [
      { field: 'query', message: 'Query parameters are invalid' },
    ])
  }
}

// Database error handler
export function handleDatabaseError(error: unknown): never {
  if (error instanceof Error) {
    // Prisma-specific error handling
    if (error.message.includes('Unique constraint')) {
      throw new ValidationError('Duplicate entry', [
        { field: 'general', message: 'This record already exists' },
      ])
    }

    if (error.message.includes('Foreign key constraint')) {
      throw new ValidationError('Invalid reference', [
        { field: 'general', message: 'Referenced record does not exist' },
      ])
    }

    if (error.message.includes('Record to update not found')) {
      throw new NotFoundError('Record not found')
    }

    // Generic database error
    throw new DatabaseError('Database operation failed', {
      cause: error,
      details: { originalMessage: error.message },
    })
  }

  throw new DatabaseError('Unknown database error')
}

// Authentication middleware
export async function requireAuth(event: H3Event) {
  const { getUserSession } = await import('./auth')
  const session = await getUserSession(event)

  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }

  // Store user in context for subsequent use
  event.context.user = session.user

  return session.user
}

// Authorization middleware
export async function requirePermission(event: H3Event, permission: string | ((user: any) => boolean)) {
  const user = await requireAuth(event)

  if (typeof permission === 'string') {
    if (!(user as any).permissions?.includes(permission)) {
      throw new AuthorizationError(`Permission '${permission}' required`)
    }
  }
  else if (typeof permission === 'function') {
    if (!permission(user)) {
      throw new AuthorizationError('Insufficient permissions')
    }
  }

  return user
}

// Rate limiting helper
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

export function checkRateLimit(event: H3Event, limit: number = 100, windowMs: number = 60000) {
  const clientIp = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || 'unknown'
  const now = Date.now()
  const key = `${clientIp}:${getRequestURL(event).pathname}`

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return
  }

  if (current.count >= limit) {
    throw new RateLimitError('Rate limit exceeded', {
      details: {
        limit,
        windowMs,
        resetTime: current.resetTime,
      },
    })
  }

  current.count++
}

// Async error wrapper for API handlers
export function asyncHandler(handler: (event: H3Event) => Promise<any>) {
  return async (event: H3Event) => {
    try {
      return await handler(event)
    }
    catch (error) {
      handleApiError(error, event)
    }
  }
}
