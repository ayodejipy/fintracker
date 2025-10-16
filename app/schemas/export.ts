import { z } from 'zod'

// Export data type schema
export const exportDataTypeSchema = z.enum(['all', 'transactions', 'budgets', 'loans', 'savings'])

// Export format schema
export const exportFormatSchema = z.enum(['csv', 'pdf'])

// Export date range schema
export const exportDateRangeSchema = z.enum(['all', 'current_month', 'last_3_months', 'current_year', 'custom'])

// Export options schema
export const exportOptionsSchema = z.object({
  dataType: exportDataTypeSchema.default('all'),
  format: exportFormatSchema.default('csv'),
  dateRange: exportDateRangeSchema.default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includePreferences: z.boolean().default(true),
  includeNotifications: z.boolean().default(false),
})

// Type exports
export type ExportDataType = z.infer<typeof exportDataTypeSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>
export type ExportDateRange = z.infer<typeof exportDateRangeSchema>
export type ExportOptions = z.infer<typeof exportOptionsSchema>

// Export configuration constants
export const DATA_TYPE_OPTIONS = [
  { value: 'all' as const, label: '📊 Complete Financial Data', description: 'All transactions, budgets, loans, and savings goals' },
  { value: 'transactions' as const, label: '💳 Transactions Only', description: 'Income and expense records' },
  { value: 'budgets' as const, label: '📈 Budgets Only', description: 'Budget limits and spending data' },
  { value: 'loans' as const, label: '🏦 Loans Only', description: 'Loan details and payment history' },
  { value: 'savings' as const, label: '🎯 Savings Goals Only', description: 'Savings goals and progress' },
]

export const FORMAT_OPTIONS = [
  { value: 'csv' as const, label: '📄 CSV (Spreadsheet)', description: 'Excel-compatible format for analysis' },
  { value: 'pdf' as const, label: '📋 PDF (Report)', description: 'Formatted report for printing/sharing' },
]

export const DATE_RANGE_OPTIONS = [
  { value: 'all' as const, label: 'All Time' },
  { value: 'current_month' as const, label: 'Current Month' },
  { value: 'last_3_months' as const, label: 'Last 3 Months' },
  { value: 'current_year' as const, label: 'Current Year' },
  { value: 'custom' as const, label: 'Custom Range' },
]
