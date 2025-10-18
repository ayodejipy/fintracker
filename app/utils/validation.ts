import { z } from 'zod'
import { SUPPORTED_CURRENCIES } from './currency'

// Common validation patterns
export const commonValidation = {
  // Email validation
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^A-Z0-9]/i, 'Password must contain at least one special character'),

  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .regex(/^[a-z\s'-]+$/i, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  // Amount validation (positive numbers with up to 2 decimal places)
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount is too large')
    .refine(
      val => Number.isFinite(val) && val > 0,
      'Please enter a valid amount',
    ),

  // Optional amount (can be 0)
  optionalAmount: z.number()
    .min(0, 'Amount cannot be negative')
    .max(999999999.99, 'Amount is too large')
    .refine(
      val => Number.isFinite(val) && val >= 0,
      'Please enter a valid amount',
    ),

  // Currency validation
  currency: z.enum(Object.keys(SUPPORTED_CURRENCIES) as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid currency' }),
  }),

  // Date validation
  date: z.coerce.date({
    required_error: 'Date is required',
    invalid_type_error: 'Please enter a valid date',
  }),

  // Future date validation
  futureDate: z.coerce.date()
    .refine(
      date => date > new Date(),
      'Date must be in the future',
    ),

  // Past or present date validation
  pastOrPresentDate: z.coerce.date()
    .refine(
      date => date <= new Date(),
      'Date cannot be in the future',
    ),

  // Description validation
  description: z.string()
    .min(1, 'Description is required')
    .max(255, 'Description is too long')
    .trim(),

  // Optional description
  optionalDescription: z.string()
    .max(255, 'Description is too long')
    .trim()
    .optional(),

  // Category validation
  category: z.string()
    .min(1, 'Category is required'),

  // Interest rate validation (0-100%)
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%')
    .refine(
      val => Number.isFinite(val),
      'Please enter a valid interest rate',
    ),

  // Percentage validation (0-100%)
  percentage: z.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100%'),

  // Phone number validation (Nigerian format)
  phoneNumber: z.string()
    .regex(
      /^(\+234|0)[789][01]\d{8}$/,
      'Please enter a valid Nigerian phone number',
    )
    .optional(),

  // ID validation
  id: z.string()
    .min(1, 'ID is required')
    .cuid('Invalid ID format'),
}

// User validation schemas
export const userValidation = {
  register: z.object({
    name: commonValidation.name,
    email: commonValidation.email,
    password: commonValidation.password,
    confirmPassword: z.string(),
  }).refine(
    data => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    },
  ),

  login: z.object({
    email: commonValidation.email,
    password: z.string().min(1, 'Password is required'),
  }),

  profile: z.object({
    name: commonValidation.name,
    email: commonValidation.email,
    monthlyIncome: commonValidation.optionalAmount,
    currency: commonValidation.currency,
    phoneNumber: commonValidation.phoneNumber,
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonValidation.password,
    confirmPassword: z.string(),
  }).refine(
    data => data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    },
  ),
}

// Transaction validation schemas
export const transactionValidation = {
  create: z.object({
    type: z.enum(['income', 'expense'], {
      errorMap: () => ({ message: 'Please select income or expense' }),
    }),
    amount: commonValidation.amount,
    category: commonValidation.category,
    description: commonValidation.description,
    date: commonValidation.pastOrPresentDate,
    isRecurring: z.boolean().optional().default(false),
    recurringFrequency: z.enum(['weekly', 'monthly', 'yearly']).optional().default('monthly'),
    reminderDays: z.number().min(0).max(30).optional().default(3),
    // Fee breakdown fields (all optional)
    vat: commonValidation.optionalAmount.optional(),
    serviceFee: commonValidation.optionalAmount.optional(),
    commission: commonValidation.optionalAmount.optional(),
    stampDuty: commonValidation.optionalAmount.optional(),
    transferFee: commonValidation.optionalAmount.optional(),
    processingFee: commonValidation.optionalAmount.optional(),
    otherFees: commonValidation.optionalAmount.optional(),
    feeNote: z.string().max(500, 'Fee note is too long').optional(),
  }),

  update: z.object({
    id: commonValidation.id,
    type: z.enum(['income', 'expense']).optional(),
    amount: commonValidation.amount.optional(),
    category: commonValidation.category.optional(),
    description: commonValidation.description.optional(),
    date: commonValidation.pastOrPresentDate.optional(),
    // Fee breakdown fields (all optional)
    vat: commonValidation.optionalAmount.optional(),
    serviceFee: commonValidation.optionalAmount.optional(),
    commission: commonValidation.optionalAmount.optional(),
    stampDuty: commonValidation.optionalAmount.optional(),
    transferFee: commonValidation.optionalAmount.optional(),
    processingFee: commonValidation.optionalAmount.optional(),
    otherFees: commonValidation.optionalAmount.optional(),
    feeNote: z.string().max(500, 'Fee note is too long').optional(),
  }).refine(
    data => Object.keys(data).length > 1, // At least one field besides ID
    'At least one field must be updated',
  ),

  filter: z.object({
    type: z.enum(['income', 'expense', 'all']).optional(),
    category: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    minAmount: commonValidation.optionalAmount.optional(),
    maxAmount: commonValidation.optionalAmount.optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate
      }
      return true
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    },
  ).refine(
    (data) => {
      if (data.minAmount && data.maxAmount) {
        return data.minAmount <= data.maxAmount
      }
      return true
    },
    {
      message: 'Minimum amount must be less than or equal to maximum amount',
      path: ['maxAmount'],
    },
  ),
}

// Budget validation schemas
export const budgetValidation = {
  create: z.object({
    category: commonValidation.category,
    monthlyLimit: commonValidation.amount,
    month: z.string()
      .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  }),

  update: z.object({
    id: commonValidation.id,
    category: commonValidation.category.optional(),
    monthlyLimit: commonValidation.amount.optional(),
    month: z.string()
      .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
      .optional(),
  }).refine(
    data => Object.keys(data).length > 1,
    'At least one field must be updated',
  ),
}

// Loan validation schemas
export const loanValidation = {
  create: z.object({
    name: z.string()
      .min(1, 'Loan name is required')
      .max(100, 'Loan name is too long'),
    initialAmount: commonValidation.amount,
    currentBalance: commonValidation.amount,
    monthlyPayment: commonValidation.amount,
    interestRate: commonValidation.interestRate,
    startDate: commonValidation.pastOrPresentDate,
  }).refine(
    data => data.currentBalance <= data.initialAmount,
    {
      message: 'Current balance cannot exceed initial amount',
      path: ['currentBalance'],
    },
  ),

  update: z.object({
    id: commonValidation.id,
    name: z.string().min(1).max(100).optional(),
    currentBalance: commonValidation.amount.optional(),
    monthlyPayment: commonValidation.amount.optional(),
    interestRate: commonValidation.interestRate.optional(),
  }).refine(
    data => Object.keys(data).length > 1,
    'At least one field must be updated',
  ),

  payment: z.object({
    id: commonValidation.id,
    amount: commonValidation.amount,
    date: commonValidation.pastOrPresentDate.optional(),
  }),
}

// Savings goal validation schemas
export const savingsGoalValidation = {
  create: z.object({
    name: z.string()
      .min(1, 'Goal name is required')
      .max(100, 'Goal name is too long'),
    targetAmount: commonValidation.amount,
    targetDate: commonValidation.futureDate,
    monthlyContribution: commonValidation.amount,
    currentAmount: commonValidation.optionalAmount.optional(),
  }),

  update: z.object({
    id: commonValidation.id,
    name: z.string().min(1).max(100).optional(),
    targetAmount: commonValidation.amount.optional(),
    targetDate: commonValidation.futureDate.optional(),
    monthlyContribution: commonValidation.amount.optional(),
  }).refine(
    data => Object.keys(data).length > 1,
    'At least one field must be updated',
  ),

  contribution: z.object({
    id: commonValidation.id,
    amount: commonValidation.amount,
    date: commonValidation.pastOrPresentDate.optional(),
  }),
}

// Notification validation schemas
export const notificationValidation = {
  preferences: z.object({
    budgetAlerts: z.boolean(),
    paymentReminders: z.boolean(),
    savingsReminders: z.boolean(),
    goalAchievements: z.boolean(),
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    budgetThreshold: z.number()
      .min(1, 'Budget threshold must be at least 1%')
      .max(100, 'Budget threshold cannot exceed 100%'),
    reminderDaysBefore: z.number()
      .min(1, 'Reminder days must be at least 1')
      .max(30, 'Reminder days cannot exceed 30'),
  }),
}

// Validation helper functions
export function validateField<T>(value: T, schema: z.ZodSchema<T>): { isValid: boolean, error?: string } {
  try {
    schema.parse(value)
    return { isValid: true }
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message }
    }
    return { isValid: false, error: 'Validation failed' }
  }
}

export function validateFormData<T>(data: T, schema: z.ZodSchema<T>): { isValid: boolean, errors?: Record<string, string>, data?: T } {
  try {
    const validatedData = schema.parse(data)
    return { isValid: true, data: validatedData }
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

// Custom validation rules for business logic
export const businessValidation = {
  // Check if user can afford a loan payment
  canAffordLoanPayment: (monthlyIncome: number, monthlyPayment: number, existingDebts: number = 0) => {
    const totalMonthlyObligations = monthlyPayment + existingDebts
    const debtToIncomeRatio = totalMonthlyObligations / monthlyIncome
    return debtToIncomeRatio <= 0.4 // 40% debt-to-income ratio limit
  },

  // Check if savings goal is realistic
  isRealisticSavingsGoal: (
    targetAmount: number,
    monthlyContribution: number,
    targetDate: Date,
    currentAmount: number = 0,
  ) => {
    const monthsToTarget = Math.ceil(
      (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30),
    )
    const requiredAmount = targetAmount - currentAmount
    const requiredMonthlyContribution = requiredAmount / monthsToTarget

    return monthlyContribution >= requiredMonthlyContribution
  },

  // Check if budget is reasonable based on income
  isReasonableBudget: (totalBudgets: number, monthlyIncome: number) => {
    return totalBudgets <= monthlyIncome * 0.9 // Leave 10% buffer
  },
}
