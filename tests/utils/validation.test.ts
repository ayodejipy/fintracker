import { describe, expect, it } from 'vitest'
import {
  businessValidation,
  commonValidation,
  loanValidation,
  notificationValidation,
  savingsGoalValidation,
  transactionValidation,
  userValidation,
  validateField,
  validateFormData,
} from '../../app/utils/validation'

describe('validation Utilities', () => {
  describe('commonValidation', () => {
    describe('email', () => {
      it('should validate correct emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
        ]

        validEmails.forEach((email) => {
          expect(() => commonValidation.email.parse(email)).not.toThrow()
        })
      })

      it('should reject invalid emails', () => {
        const invalidEmails = [
          '',
          'invalid-email',
          '@domain.com',
          'user@',
          'user@domain',
          `${'a'.repeat(256)}@example.com`, // too long
        ]

        invalidEmails.forEach((email) => {
          expect(() => commonValidation.email.parse(email)).toThrow()
        })
      })
    })

    describe('password', () => {
      it('should validate strong passwords', () => {
        const validPasswords = [
          'Password123!',
          'MyStr0ng@Pass',
          'C0mplex#Password',
        ]

        validPasswords.forEach((password) => {
          expect(() => commonValidation.password.parse(password)).not.toThrow()
        })
      })

      it('should reject weak passwords', () => {
        const invalidPasswords = [
          'short', // too short
          'nouppercase123!', // no uppercase
          'NOLOWERCASE123!', // no lowercase
          'NoNumbers!', // no numbers
          'NoSpecialChar123', // no special characters
        ]

        invalidPasswords.forEach((password) => {
          expect(() => commonValidation.password.parse(password)).toThrow()
        })
      })
    })

    describe('amount', () => {
      it('should validate positive amounts', () => {
        const validAmounts = [0.01, 100, 1000.50, 999999999.99]

        validAmounts.forEach((amount) => {
          expect(() => commonValidation.amount.parse(amount)).not.toThrow()
        })
      })

      it('should reject invalid amounts', () => {
        const invalidAmounts = [0, -100, 1000000000, Number.NaN, Infinity]

        invalidAmounts.forEach((amount) => {
          expect(() => commonValidation.amount.parse(amount)).toThrow()
        })
      })
    })

    describe('phoneNumber', () => {
      it('should validate Nigerian phone numbers', () => {
        const validNumbers = [
          '+2348012345678',
          '08012345678',
          '+2347012345678',
          '07012345678',
          '+2349012345678',
          '09012345678',
        ]

        validNumbers.forEach((number) => {
          expect(() => commonValidation.phoneNumber.parse(number)).not.toThrow()
        })
      })

      it('should reject invalid phone numbers', () => {
        const invalidNumbers = [
          '1234567890', // wrong format
          '+1234567890', // wrong country code
          '080123456789', // too long
          '0801234567', // too short
          '+234801234567', // too short
        ]

        invalidNumbers.forEach((number) => {
          expect(() => commonValidation.phoneNumber.parse(number)).toThrow()
        })
      })
    })
  })

  describe('userValidation', () => {
    describe('register', () => {
      it('should validate correct registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }

        expect(() => userValidation.register.parse(validData)).not.toThrow()
      })

      it('should reject mismatched passwords', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        }

        expect(() => userValidation.register.parse(invalidData)).toThrow()
      })
    })

    describe('profile', () => {
      it('should validate profile data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          monthlyIncome: 50000,
          currency: 'NGN',
          phoneNumber: '+2348012345678',
        }

        expect(() => userValidation.profile.parse(validData)).not.toThrow()
      })
    })
  })

  describe('transactionValidation', () => {
    describe('create', () => {
      it('should validate transaction creation data', () => {
        const validData = {
          type: 'expense' as const,
          amount: 1000,
          category: 'food',
          description: 'Grocery shopping',
          date: new Date('2024-01-15'),
        }

        expect(() => transactionValidation.create.parse(validData)).not.toThrow()
      })

      it('should reject future dates', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 1)

        const invalidData = {
          type: 'expense' as const,
          amount: 1000,
          category: 'food',
          description: 'Grocery shopping',
          date: futureDate,
        }

        expect(() => transactionValidation.create.parse(invalidData)).toThrow()
      })
    })

    describe('filter', () => {
      it('should validate filter parameters', () => {
        const validFilter = {
          type: 'expense' as const,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          minAmount: 0,
          maxAmount: 1000,
        }

        expect(() => transactionValidation.filter.parse(validFilter)).not.toThrow()
      })

      it('should reject invalid date ranges', () => {
        const invalidFilter = {
          startDate: new Date('2024-01-31'),
          endDate: new Date('2024-01-01'), // end before start
        }

        expect(() => transactionValidation.filter.parse(invalidFilter)).toThrow()
      })

      it('should reject invalid amount ranges', () => {
        const invalidFilter = {
          minAmount: 1000,
          maxAmount: 500, // max less than min
        }

        expect(() => transactionValidation.filter.parse(invalidFilter)).toThrow()
      })
    })
  })

  describe('loanValidation', () => {
    describe('create', () => {
      it('should validate loan creation data', () => {
        const validData = {
          name: 'Car Loan',
          initialAmount: 50000,
          currentBalance: 45000,
          monthlyPayment: 5000,
          interestRate: 12.5,
          startDate: new Date('2024-01-01'),
        }

        expect(() => loanValidation.create.parse(validData)).not.toThrow()
      })

      it('should reject current balance exceeding initial amount', () => {
        const invalidData = {
          name: 'Car Loan',
          initialAmount: 50000,
          currentBalance: 60000, // exceeds initial
          monthlyPayment: 5000,
          interestRate: 12.5,
          startDate: new Date('2024-01-01'),
        }

        expect(() => loanValidation.create.parse(invalidData)).toThrow()
      })
    })
  })

  describe('savingsGoalValidation', () => {
    describe('create', () => {
      it('should validate savings goal creation data', () => {
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)

        const validData = {
          name: 'Emergency Fund',
          targetAmount: 100000,
          targetDate: futureDate,
          monthlyContribution: 10000,
          currentAmount: 5000,
        }

        expect(() => savingsGoalValidation.create.parse(validData)).not.toThrow()
      })

      it('should reject past target dates', () => {
        const pastDate = new Date('2020-01-01')

        const invalidData = {
          name: 'Emergency Fund',
          targetAmount: 100000,
          targetDate: pastDate,
          monthlyContribution: 10000,
        }

        expect(() => savingsGoalValidation.create.parse(invalidData)).toThrow()
      })
    })
  })

  describe('notificationValidation', () => {
    describe('preferences', () => {
      it('should validate notification preferences', () => {
        const validData = {
          budgetAlerts: true,
          paymentReminders: true,
          savingsReminders: false,
          goalAchievements: true,
          emailNotifications: false,
          pushNotifications: true,
          budgetThreshold: 80,
          reminderDaysBefore: 3,
        }

        expect(() => notificationValidation.preferences.parse(validData)).not.toThrow()
      })

      it('should reject invalid threshold values', () => {
        const invalidData = {
          budgetAlerts: true,
          paymentReminders: true,
          savingsReminders: false,
          goalAchievements: true,
          emailNotifications: false,
          pushNotifications: true,
          budgetThreshold: 150, // exceeds 100%
          reminderDaysBefore: 3,
        }

        expect(() => notificationValidation.preferences.parse(invalidData)).toThrow()
      })
    })
  })

  describe('validateField', () => {
    it('should validate single field correctly', () => {
      const result = validateField('test@example.com', commonValidation.email)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return error for invalid field', () => {
      const result = validateField('invalid-email', commonValidation.email)
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('validateFormData', () => {
    it('should validate complete form data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }

      const result = validateFormData(data, userValidation.register)
      expect(result.isValid).toBe(true)
      expect(result.data).toEqual(data)
      expect(result.errors).toBeUndefined()
    })

    it('should return errors for invalid form data', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'different',
      }

      const result = validateFormData(data, userValidation.register)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(Object.keys(result.errors!)).toContain('name')
      expect(Object.keys(result.errors!)).toContain('email')
      expect(Object.keys(result.errors!)).toContain('password')
    })
  })

  describe('businessValidation', () => {
    describe('canAffordLoanPayment', () => {
      it('should return true for affordable payments', () => {
        const result = businessValidation.canAffordLoanPayment(100000, 30000, 10000)
        expect(result).toBe(true) // 40% debt-to-income ratio
      })

      it('should return false for unaffordable payments', () => {
        const result = businessValidation.canAffordLoanPayment(100000, 35000, 10000)
        expect(result).toBe(false) // 45% debt-to-income ratio
      })
    })

    describe('isRealisticSavingsGoal', () => {
      it('should return true for realistic goals', () => {
        const targetDate = new Date()
        targetDate.setMonth(targetDate.getMonth() + 12) // 12 months from now

        const result = businessValidation.isRealisticSavingsGoal(
          120000, // target amount
          10000, // monthly contribution
          targetDate,
          0, // current amount
        )
        expect(result).toBe(true)
      })

      it('should return false for unrealistic goals', () => {
        const targetDate = new Date()
        targetDate.setMonth(targetDate.getMonth() + 6) // 6 months from now

        const result = businessValidation.isRealisticSavingsGoal(
          120000, // target amount
          5000, // monthly contribution (too low)
          targetDate,
          0, // current amount
        )
        expect(result).toBe(false)
      })
    })

    describe('isReasonableBudget', () => {
      it('should return true for reasonable budgets', () => {
        const result = businessValidation.isReasonableBudget(80000, 100000)
        expect(result).toBe(true) // 80% of income
      })

      it('should return false for excessive budgets', () => {
        const result = businessValidation.isReasonableBudget(95000, 100000)
        expect(result).toBe(false) // 95% of income (too high)
      })
    })
  })
})
