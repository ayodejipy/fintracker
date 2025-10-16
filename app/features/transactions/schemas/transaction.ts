import { z } from 'zod'

// Define expense categories enum to match the ExpenseCategory type
const expenseCategoryEnum = z.enum([
  'loan_repayment',
  'home_allowance',
  'rent',
  'transport',
  'food',
  'data_airtime',
  'miscellaneous',
  'savings',
])

// Base transaction schema
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Transaction type is required',
  }),
  amount: z.number({
    required_error: 'Amount is required',
  }).positive('Amount must be greater than 0'),
  category: expenseCategoryEnum,
  description: z.string({
    required_error: 'Description is required',
  }).min(1, 'Description is required').max(255, 'Description must be less than 255 characters'),
  date: z.date({
    required_error: 'Date is required',
  }),
})

// Create transaction schema (for new transactions)
export const createTransactionSchema = transactionSchema

// Update transaction schema (all fields optional for partial updates)
export const updateTransactionSchema = transactionSchema.partial()

// Transaction filter schema
export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  month: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

// Form data schema (for UI forms with string dates and categories)
export const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Transaction type is required',
  }),
  amount: z.number({
    required_error: 'Amount is required',
  }).positive('Amount must be greater than 0'),
  category: z.string({
    required_error: 'Category is required',
  }).min(1, 'Category is required'),
  description: z.string({
    required_error: 'Description is required',
  }).min(1, 'Description is required').max(255, 'Description must be less than 255 characters'),
  date: z.string({
    required_error: 'Date is required',
  }).min(1, 'Date is required'),
})

// Type exports
export type TransactionInput = z.infer<typeof transactionSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>
export type TransactionFormInput = z.infer<typeof transactionFormSchema>
