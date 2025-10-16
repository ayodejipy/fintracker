import { describe, expect, it } from 'vitest'
import { hashPassword, loginSchema, registerSchema, sanitizeUser, verifyPassword } from '../../app/utils/auth'

describe('auth Utilities', () => {
  describe('password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
    })

    it('should verify a correct password', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('user Sanitization', () => {
    it('should remove password from user object', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        monthlyIncome: 50000,
        currency: 'NGN',
      }

      const sanitized = sanitizeUser(user)

      expect(sanitized).not.toHaveProperty('password')
      expect(sanitized).toHaveProperty('id')
      expect(sanitized).toHaveProperty('email')
      expect(sanitized).toHaveProperty('name')
    })
  })

  describe('validation Schemas', () => {
    describe('login Schema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
        }

        const result = loginSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'password123',
        }

        const result = loginSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject short password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '123',
        }

        const result = loginSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('register Schema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          monthlyIncome: 50000,
        }

        const result = registerSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject mismatched passwords', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'different123',
          monthlyIncome: 50000,
        }

        const result = registerSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject negative monthly income', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          monthlyIncome: -1000,
        }

        const result = registerSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })
  })
})
