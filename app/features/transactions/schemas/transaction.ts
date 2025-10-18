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

// Fee fields schema (all optional)
export const feeFieldsSchema = z.object({
  vat: z.number().nonnegative('VAT must be non-negative').optional(),
  serviceFee: z.number().nonnegative('Service fee must be non-negative').optional(),
  commission: z.number().nonnegative('Commission must be non-negative').optional(),
  stampDuty: z.number().nonnegative('Stamp duty must be non-negative').optional(),
  transferFee: z.number().nonnegative('Transfer fee must be non-negative').optional(),
  processingFee: z.number().nonnegative('Processing fee must be non-negative').optional(),
  otherFees: z.number().nonnegative('Other fees must be non-negative').optional(),
  feeNote: z.string().max(500, 'Fee note must be less than 500 characters').optional(),
}).optional()

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
  // Fee breakdown fields (optional)
  vat: z.number().nonnegative().optional(),
  serviceFee: z.number().nonnegative().optional(),
  commission: z.number().nonnegative().optional(),
  stampDuty: z.number().nonnegative().optional(),
  transferFee: z.number().nonnegative().optional(),
  processingFee: z.number().nonnegative().optional(),
  otherFees: z.number().nonnegative().optional(),
  feeNote: z.string().max(500).optional(),
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
  // Fee breakdown fields (optional)
  vat: z.number().nonnegative().optional(),
  serviceFee: z.number().nonnegative().optional(),
  commission: z.number().nonnegative().optional(),
  stampDuty: z.number().nonnegative().optional(),
  transferFee: z.number().nonnegative().optional(),
  processingFee: z.number().nonnegative().optional(),
  otherFees: z.number().nonnegative().optional(),
  feeNote: z.string().max(500).optional(),
})

// Type exports
export type TransactionInput = z.infer<typeof transactionSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>
export type TransactionFormInput = z.infer<typeof transactionFormSchema>
