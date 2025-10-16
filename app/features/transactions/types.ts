export enum ExpenseCategory {
  LOAN_REPAYMENT = 'loan_repayment',
  HOME_ALLOWANCE = 'home_allowance',
  RENT = 'rent',
  TRANSPORT = 'transport',
  FOOD = 'food',
  DATA_AIRTIME = 'data_airtime',
  MISCELLANEOUS = 'miscellaneous',
  SAVINGS = 'savings',
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  category: ExpenseCategory
  description: string
  date: Date
  type: 'income' | 'expense'
  createdAt: Date
}

export interface CreateTransactionInput {
  amount: number
  category: ExpenseCategory
  description: string
  date: Date
  type: 'income' | 'expense'
}

export interface UpdateTransactionInput {
  amount?: number
  category?: ExpenseCategory
  description?: string
  date?: Date
}
