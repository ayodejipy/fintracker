import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  AppErrorClass,
  BusinessLogicError,
  categorizeError,
  createBusinessLogicError,
  createValidationError,
  ErrorSeverity,
  ErrorType,
  getRecoverySuggestions,
  getUserFriendlyMessage,
  transformZodError,
  ValidationError,
} from '../../app/utils/error-handling'

describe('error Handling Utilities', () => {
  describe('appErrorClass', () => {
    it('should create an error with correct properties', () => {
      const error = new AppErrorClass(
        ErrorType.VALIDATION,
        'Test error',
        ErrorSeverity.HIGH,
        {
          code: 'TEST_ERROR',
          details: { field: 'test' },
          userId: 'user123',
        },
      )

      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.message).toBe('Test error')
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.details).toEqual({ field: 'test' })
      expect(error.userId).toBe('user123')
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should have default severity of MEDIUM', () => {
      const error = new AppErrorClass(ErrorType.SERVER, 'Test error')
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
    })
  })

  describe('validationError', () => {
    it('should create validation error with validation details', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email', code: 'invalid_email' },
        { field: 'password', message: 'Too short', value: '123' },
      ]

      const error = new ValidationError('Validation failed', validationErrors)

      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.validationErrors).toEqual(validationErrors)
      expect(error.details?.validationErrors).toEqual(validationErrors)
    })
  })

  describe('businessLogicError', () => {
    it('should create business logic error', () => {
      const error = new BusinessLogicError('Insufficient funds', {
        code: 'INSUFFICIENT_FUNDS',
        details: { balance: 100, required: 200 },
      })

      expect(error.type).toBe(ErrorType.BUSINESS_LOGIC)
      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
      expect(error.code).toBe('INSUFFICIENT_FUNDS')
      expect(error.details).toEqual({ balance: 100, required: 200 })
    })
  })

  describe('transformZodError', () => {
    it('should transform Zod error to ValidationError', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      })

      try {
        schema.parse({ email: 'invalid', age: 15 })
      }
      catch (zodError) {
        const appError = transformZodError(zodError as z.ZodError)

        expect(appError).toBeInstanceOf(ValidationError)
        expect(appError.type).toBe(ErrorType.VALIDATION)
        expect(appError.validationErrors).toHaveLength(2)

        const emailError = appError.validationErrors.find(e => e.field === 'email')
        const ageError = appError.validationErrors.find(e => e.field === 'age')

        expect(emailError?.message).toContain('email')
        expect(ageError?.message).toContain('18')
      }
    })
  })

  describe('categorizeError', () => {
    it('should return AppErrorClass as-is', () => {
      const originalError = new AppErrorClass(ErrorType.SERVER, 'Server error')
      const categorized = categorizeError(originalError)
      expect(categorized).toBe(originalError)
    })

    it('should transform Zod errors', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ])

      const categorized = categorizeError(zodError)
      expect(categorized).toBeInstanceOf(ValidationError)
    })

    it('should categorize network errors', () => {
      const networkError = new Error('fetch failed')
      const categorized = categorizeError(networkError)

      expect(categorized.type).toBe(ErrorType.NETWORK)
      expect(categorized.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should categorize database errors', () => {
      const dbError = new Error('database connection failed')
      const categorized = categorizeError(dbError)

      expect(categorized.type).toBe(ErrorType.DATABASE)
      expect(categorized.severity).toBe(ErrorSeverity.HIGH)
    })

    it('should handle unknown errors', () => {
      const unknownError = 'string error'
      const categorized = categorizeError(unknownError)

      expect(categorized.type).toBe(ErrorType.UNKNOWN)
      expect(categorized.message).toBe('An unknown error occurred')
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('should return appropriate messages for each error type', () => {
      const validationError = new AppErrorClass(ErrorType.VALIDATION, 'Validation failed')
      const authError = new AppErrorClass(ErrorType.AUTHENTICATION, 'Auth failed')
      const networkError = new AppErrorClass(ErrorType.NETWORK, 'Network failed')

      expect(getUserFriendlyMessage(validationError)).toContain('check your input')
      expect(getUserFriendlyMessage(authError)).toContain('log in')
      expect(getUserFriendlyMessage(networkError)).toContain('internet connection')
    })

    it('should use specific message for business logic errors', () => {
      const businessError = new AppErrorClass(
        ErrorType.BUSINESS_LOGIC,
        'Insufficient funds for this transaction',
      )

      expect(getUserFriendlyMessage(businessError)).toBe('Insufficient funds for this transaction')
    })
  })

  describe('getRecoverySuggestions', () => {
    it('should return appropriate suggestions for each error type', () => {
      const validationError = new AppErrorClass(ErrorType.VALIDATION, 'Validation failed')
      const networkError = new AppErrorClass(ErrorType.NETWORK, 'Network failed')
      const rateLimitError = new AppErrorClass(ErrorType.RATE_LIMIT, 'Rate limit exceeded')

      const validationSuggestions = getRecoverySuggestions(validationError)
      const networkSuggestions = getRecoverySuggestions(networkError)
      const rateLimitSuggestions = getRecoverySuggestions(rateLimitError)

      expect(validationSuggestions).toContain('Double-check all required fields are filled')
      expect(networkSuggestions).toContain('Check your internet connection')
      expect(rateLimitSuggestions).toContain('Wait a few minutes before trying again')
    })

    it('should return default suggestions for unknown error types', () => {
      const unknownError = new AppErrorClass(ErrorType.UNKNOWN, 'Unknown error')
      const suggestions = getRecoverySuggestions(unknownError)

      expect(suggestions).toContain('Try refreshing the page')
      expect(suggestions).toContain('Contact support if the problem persists')
    })
  })

  describe('error factory functions', () => {
    it('should create validation error with factory', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email' },
      ]

      const error = createValidationError('Validation failed', validationErrors, {
        code: 'VALIDATION_ERROR',
        userId: 'user123',
      })

      expect(error).toBeInstanceOf(ValidationError)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.userId).toBe('user123')
      expect(error.validationErrors).toEqual(validationErrors)
    })

    it('should create business logic error with factory', () => {
      const error = createBusinessLogicError('Business rule violated', {
        code: 'BUSINESS_RULE_VIOLATION',
        details: { rule: 'max_transactions_per_day' },
      })

      expect(error).toBeInstanceOf(BusinessLogicError)
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION')
      expect(error.details).toEqual({ rule: 'max_transactions_per_day' })
    })
  })

  describe('error inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const validationError = new ValidationError('Test', [])
      const businessError = new BusinessLogicError('Test')
      const appError = new AppErrorClass(ErrorType.SERVER, 'Test')

      expect(validationError).toBeInstanceOf(ValidationError)
      expect(validationError).toBeInstanceOf(AppErrorClass)
      expect(validationError).toBeInstanceOf(Error)

      expect(businessError).toBeInstanceOf(BusinessLogicError)
      expect(businessError).toBeInstanceOf(AppErrorClass)
      expect(businessError).toBeInstanceOf(Error)

      expect(appError).toBeInstanceOf(AppErrorClass)
      expect(appError).toBeInstanceOf(Error)
    })
  })
})

describe('error Integration Tests', () => {
  it('should handle complete error flow', () => {
    // Simulate a validation error from user input
    const schema = z.object({
      amount: z.number().positive(),
      email: z.string().email(),
    })

    const invalidData = { amount: -100, email: 'invalid-email' }

    try {
      schema.parse(invalidData)
    }
    catch (zodError) {
      const appError = transformZodError(zodError as z.ZodError)
      const friendlyMessage = getUserFriendlyMessage(appError)
      const suggestions = getRecoverySuggestions(appError)

      expect(appError.type).toBe(ErrorType.VALIDATION)
      expect(appError.validationErrors).toHaveLength(2)
      expect(friendlyMessage).toContain('check your input')
      expect(suggestions.length).toBeGreaterThan(0)
    }
  })

  it('should handle error categorization flow', () => {
    const errors = [
      new Error('fetch failed'),
      new Error('database connection lost'),
      new z.ZodError([]),
      'unknown error',
      new AppErrorClass(ErrorType.BUSINESS_LOGIC, 'Custom error'),
    ]

    errors.forEach((error) => {
      const categorized = categorizeError(error)
      expect(categorized).toBeInstanceOf(AppErrorClass)
      expect(categorized.type).toBeDefined()
      expect(categorized.severity).toBeDefined()
      expect(categorized.timestamp).toBeInstanceOf(Date)
    })
  })
})
