export interface Loan {
  id: string
  userId: string
  name: string
  initialAmount: number
  currentBalance: number
  monthlyPayment: number
  interestRate: number
  startDate: Date
  projectedPayoffDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateLoanInput {
  name: string
  initialAmount: number
  monthlyPayment: number
  interestRate?: number
  startDate: Date
}

export interface PaymentInput {
  amount: number
  date: Date
  description?: string
}

export interface LoanProjection {
  remainingBalance: number
  payoffDate: Date
  totalInterestPaid: number
  paymentSchedule: PaymentScheduleItem[]
}

export interface PaymentScheduleItem {
  month: string
  payment: number
  principal: number
  interest: number
  balance: number
}
