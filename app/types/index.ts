// Core type definitions for the personal finance dashboard

export interface User {
  id: string
  email: string
  name: string
  monthlyIncome: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  amount: number // Main transaction amount (before fees)
  category: ExpenseCategory | string // Can be ExpenseCategory or custom category name
  description: string
  date: Date
  type: 'income' | 'expense'
  isRecurring: boolean
  recurringExpenseId?: string

  // Fee breakdown fields for transparency
  vat?: number             // VAT/Tax amount (e.g., 7.5% in Nigeria)
  serviceFee?: number      // Restaurant/hotel service charges
  commission?: number      // Bank/payment processor commissions
  stampDuty?: number       // Nigerian stamp duty on transfers (₦50 for >₦10,000)
  transferFee?: number     // Inter-bank transfer fees
  processingFee?: number   // Payment processing charges
  otherFees?: number       // Any other miscellaneous fees
  feeNote?: string         // Optional note about fees
  total?: number           // Total amount (amount + all fees) - what was actually debited/credited

  // Import and review workflow fields
  isImported?: boolean
  importSource?: string
  originalDesc?: string
  confidence?: TransactionConfidence
  needsReview?: boolean
  flags?: string[]
  userNote?: string
  reviewedAt?: Date

  createdAt: Date
  updatedAt: Date
  recurringExpense?: RecurringExpense
}

export interface Loan {
  id: string
  userId: string
  name: string
  initialAmount: number
  currentBalance: number
  monthlyPayment: number
  interestRate: number
  startDate: Date
  projectedPayoffDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: string
  userId: string
  category: ExpenseCategory
  monthlyLimit: number
  currentSpent: number
  month: string // YYYY-MM format
  createdAt: Date
  updatedAt: Date
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  monthlyContribution: number
  createdAt: Date
  updatedAt: Date
}

export interface CustomCategory {
  id: string
  userId: string | null  // null = system category
  name: string
  value: string  // Database value (e.g., "food_groceries", "transportation")
  type: 'income' | 'expense' | 'fee'
  icon?: string
  color?: string
  description?: string
  isSystem: boolean  // true = default/system category
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  budgetUtilization: number
  recentTransactions: Transaction[]
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TransactionApiResponse {
  success: boolean
  data: Transaction
  message?: string
}

export interface TransactionSummaryResponse {
  success: boolean
  data: {
    totalIncome: number
    totalExpenses: number
    netAmount: number
    categoryBreakdown: Array<{
      category: ExpenseCategory
      amount: number
      count: number
    }>
    monthlyTrend: Array<{
      month: string
      income: number
      expenses: number
    }>
  }
}

export interface BudgetApiResponse {
  success: boolean
  data: Budget
  message?: string
}

export interface BudgetListResponse {
  success: boolean
  data: Budget[]
}

export interface BudgetAnalysisResponse {
  success: boolean
  data: {
    month: string
    totalBudget: number
    totalSpent: number
    totalRemaining: number
    utilizationRate: number
    categoryAnalysis: Array<{
      category: ExpenseCategory
      budgeted: number
      spent: number
      remaining: number
      utilizationRate: number
      status: 'under_budget' | 'near_limit' | 'over_budget'
    }>
    alerts: Array<{
      type: 'warning' | 'danger'
      category: ExpenseCategory
      message: string
      amount: number
    }>
    recommendations: Array<{
      type: 'savings' | 'reallocation' | 'adjustment'
      message: string
      category?: ExpenseCategory
      suggestedAmount?: number
    }>
  }
}

// Form types
export interface TransactionForm {
  amount: number
  description: string
  category: ExpenseCategory
  type: 'income' | 'expense'
  date: string
}

export interface LoanForm {
  name: string
  initialAmount: number
  monthlyPayment: number
  interestRate: number
  startDate: string
}

export interface BudgetForm {
  category: ExpenseCategory
  monthlyLimit: number
  month: string
}

export interface SavingsGoalForm {
  name: string
  targetAmount: number
  targetDate: string
  monthlyContribution: number
}

// Input types for API operations
export interface CreateTransactionInput {
  amount: number
  category: ExpenseCategory | string
  description: string
  date: Date | string
  type: 'income' | 'expense'
  // Fee fields
  vat?: number
  serviceFee?: number
  commission?: number
  stampDuty?: number
  transferFee?: number
  processingFee?: number
  otherFees?: number
  feeNote?: string
  total?: number // Auto-calculated if not provided
}

export interface UpdateTransactionInput {
  amount?: number
  category?: ExpenseCategory | string
  description?: string
  date?: Date | string
  type?: 'income' | 'expense'
  // Fee fields
  vat?: number
  serviceFee?: number
  commission?: number
  stampDuty?: number
  transferFee?: number
  processingFee?: number
  otherFees?: number
  feeNote?: string
  total?: number // Auto-calculated if not provided
}

export interface CreateLoanInput {
  name: string
  initialAmount: number
  monthlyPayment: number
  interestRate?: number
  startDate: Date
}

export interface CreateBudgetInput {
  category: ExpenseCategory
  monthlyLimit: number
  month: string
}

export interface CreateSavingsGoalInput {
  name: string
  targetAmount: number
  targetDate: Date
  monthlyContribution: number
}

export interface CreateCustomCategoryInput {
  name: string
  value: string  // Must be unique per user and type
  type: 'income' | 'expense' | 'fee'
  icon?: string
  color?: string
  description?: string
  sortOrder?: number
}

export interface UpdateCustomCategoryInput {
  name?: string
  value?: string
  icon?: string
  color?: string
  description?: string
  isActive?: boolean
}

// Nigerian-specific expense categories
export type ExpenseCategory
  = | 'loan_repayment'
    | 'home_allowance'
    | 'rent'
    | 'transport'
    | 'food'
    | 'data_airtime'
    | 'miscellaneous'
    | 'savings'
    | 'vat'

export type NigerianExpenseCategories = Record<ExpenseCategory, string>

// Auth types
export interface AuthUser {
  id: string
  email: string
  name: string
  monthlyIncome: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSession {
  user: AuthUser
}

export interface AuthResponse {
  success: boolean
  user: AuthUser
  message?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  monthlyIncome: number
}

export interface ProfileUpdateData {
  name: string
  email: string
  monthlyIncome: number
  currency: string
}

// UI Component types
export interface FormInputProps {
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

export interface FormButtonProps {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: string
  text?: string
  fullWidth?: boolean
}

export interface DropdownMenuItem {
  label: string
  icon?: string
  slot?: string
  disabled?: boolean
  click?: () => void
}

// Error handling types
export interface AppError {
  message: string
  code?: string
  statusCode?: number
}

export interface ValidationError {
  field: string
  message: string
}

export interface FormError {
  general?: string
  fields?: Record<string, string>
}

// API Error response
export interface ApiErrorResponse {
  success: false
  message: string
  code?: string
  errors?: ValidationError[]
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Fee calculation helper type
export interface TransactionFeeBreakdown {
  baseAmount: number           // Amount before fees
  vat: number
  serviceFee: number
  commission: number
  stampDuty: number
  transferFee: number
  processingFee: number
  otherFees: number
  totalFees: number            // Sum of all fees
  totalAmount: number          // Base + all fees (should equal transaction.amount)
}

// Date utility types
export type DateString = string // ISO date string
export type MonthString = string // YYYY-MM format

// Currency types
export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP'

// Status types
export type TransactionStatus = 'pending' | 'completed' | 'failed'
export type TransactionConfidence = 'high' | 'medium' | 'low' | 'manual'
export type LoanStatus = 'active' | 'paid_off' | 'defaulted'
export type GoalStatus = 'active' | 'completed' | 'paused'

// Notification types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  priority: NotificationPriority
  scheduledAt?: Date
  readAt?: Date
  createdAt: Date
  budgetId?: string
  loanId?: string
  savingsGoalId?: string
  transactionId?: string
}

export type NotificationType
  = | 'budget_alert'
    | 'payment_reminder'
    | 'savings_reminder'
    | 'goal_achieved'
    | 'overspending_warning'
    | 'goal_milestone'

export type NotificationPriority = 'low' | 'medium' | 'high'

export interface NotificationPreferences {
  id: string
  userId: string
  budgetAlerts: boolean
  paymentReminders: boolean
  savingsReminders: boolean
  goalAchievements: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  budgetThreshold: number
  reminderDaysBefore: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationInput {
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  scheduledAt?: Date
  budgetId?: string
  loanId?: string
  savingsGoalId?: string
  transactionId?: string
}

export interface NotificationApiResponse {
  success: boolean
  data: Notification
  message?: string
}

export interface NotificationListResponse {
  success: boolean
  data: Notification[]
  unreadCount: number
}

// Recurring Expense types
export interface RecurringExpense {
  id: string
  userId: string
  name: string
  amount: number
  category: ExpenseCategory
  frequency: RecurringFrequency
  nextDueDate: Date
  lastPaidDate?: Date
  isActive: boolean
  description?: string
  reminderDays: number
  autoCreateTransaction: boolean
  createdAt: Date
  updatedAt: Date
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

export interface RecurringExpenseForm {
  name: string
  amount: number
  category: ExpenseCategory
  frequency: RecurringFrequency
  nextDueDate: string
  description?: string
  reminderDays: number
  autoCreateTransaction: boolean
}

export interface CreateRecurringExpenseInput {
  name: string
  amount: number
  category: ExpenseCategory
  frequency: RecurringFrequency
  nextDueDate: Date
  description?: string
  reminderDays?: number
  autoCreateTransaction?: boolean
}

export interface UpdateRecurringExpenseInput {
  name?: string
  amount?: number
  category?: ExpenseCategory
  frequency?: RecurringFrequency
  nextDueDate?: Date
  description?: string
  reminderDays?: number
  autoCreateTransaction?: boolean
  isActive?: boolean
}

export interface RecurringExpenseApiResponse {
  success: boolean
  data: RecurringExpense
  message?: string
}

export interface RecurringExpenseListResponse {
  success: boolean
  data: RecurringExpense[]
}

export interface RecurringExpenseSummary {
  totalMonthlyCommitments: number
  upcomingExpenses: Array<{
    id: string
    name: string
    amount: number
    dueDate: Date
    daysUntilDue: number
  }>
  recurringVsNonRecurring: {
    recurring: number
    nonRecurring: number
    recurringPercentage: number
  }
}

// PDF Import types
export interface ParsedTransaction {
  date: string
  description: string
  amount: number // Main transaction amount (before fees)
  type: 'debit' | 'credit'
  balance?: number
  category?: string // Category value (e.g., "food_groceries", "transportation", "salary")
  confidence?: TransactionConfidence
  needsReview?: boolean
  flags?: TransactionFlag[]
  originalDesc?: string
  // Fee breakdown fields (extracted from statements)
  vat?: number
  serviceFee?: number
  commission?: number
  stampDuty?: number
  transferFee?: number
  processingFee?: number
  otherFees?: number
  feeNote?: string
  // Total amount (amount + all fees) - what was actually debited/credited
  total?: number
}

export type TransactionFlag =
  | 'NO_DESCRIPTION'
  | 'GENERIC_DESCRIPTION'
  | 'ONLY_NUMBERS'
  | 'AMBIGUOUS'
  | 'UNUSUAL_AMOUNT'
  | 'DUPLICATE_SUSPECTED'

export interface BankStatementParseResult {
  bankName: string
  accountNumber?: string
  period?: {
    from: string
    to: string
  }
  transactions: ParsedTransaction[]
  summary: {
    total: number
    autoCategorized: number
    needsReview: number
    flagged: number
  }
}

export interface ImportTransactionReview {
  transactions: ParsedTransaction[]
  importSource: string
  uploadedAt: Date
}

export interface BulkImportRequest {
  transactions: Array<{
    date: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: ExpenseCategory
    userNote?: string
    // Fee fields
    vat?: number
    serviceFee?: number
    commission?: number
    stampDuty?: number
    transferFee?: number
    processingFee?: number
    otherFees?: number
    feeNote?: string
    total?: number
  }>
  importSource: string
}

export interface BulkImportResponse {
  success: boolean
  imported: number
  failed: number
  errors?: Array<{
    index: number
    message: string
  }>
}
