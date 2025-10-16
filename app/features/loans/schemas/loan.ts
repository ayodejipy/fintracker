import { z } from 'zod'

// Base loan schema
export const loanSchema = z.object({
  name: z.string({
    required_error: 'Loan name is required',
  }).min(1, 'Loan name is required').max(100, 'Loan name must be less than 100 characters'),
  initialAmount: z.number({
    required_error: 'Initial amount is required',
  }).positive('Initial amount must be greater than 0'),
  currentBalance: z.number({
    required_error: 'Current balance is required',
  }).min(0, 'Current balance cannot be negative'),
  monthlyPayment: z.number({
    required_error: 'Monthly payment is required',
  }).positive('Monthly payment must be greater than 0'),
  interestRate: z.number({
    required_error: 'Interest rate is required',
  }).min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
})

// Create loan schema (for new loans)
export const createLoanSchema = loanSchema

// Update loan schema (all fields optional for partial updates)
export const updateLoanSchema = loanSchema.partial()

// Loan filter schema
export const loanFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'paid']).default('all'),
})

// Form data schema (for UI forms with string dates)
export const loanFormSchema = z.object({
  name: z.string({
    required_error: 'Loan name is required',
  }).min(1, 'Loan name is required').max(100, 'Loan name must be less than 100 characters'),
  initialAmount: z.number({
    required_error: 'Initial amount is required',
  }).positive('Initial amount must be greater than 0'),
  currentBalance: z.number({
    required_error: 'Current balance is required',
  }).min(0, 'Current balance cannot be negative'),
  monthlyPayment: z.number({
    required_error: 'Monthly payment is required',
  }).positive('Monthly payment must be greater than 0'),
  interestRate: z.number({
    required_error: 'Interest rate is required',
  }).min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  startDate: z.string({
    required_error: 'Start date is required',
  }).min(1, 'Start date is required'),
})

// Payment schema
export const paymentSchema = z.object({
  amount: z.number({
    required_error: 'Payment amount is required',
  }).positive('Payment amount must be greater than 0'),
  date: z.date({
    required_error: 'Payment date is required',
  }),
  note: z.string().optional(),
})

// Type exports
export type LoanInput = z.infer<typeof loanSchema>
export type CreateLoanInput = z.infer<typeof createLoanSchema>
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>
export type LoanFilterInput = z.infer<typeof loanFilterSchema>
export type LoanFormInput = z.infer<typeof loanFormSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
