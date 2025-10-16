import { formatCurrency } from './currency'

export interface ExportOptions {
  format: 'csv' | 'json'
  dateRange?: {
    start: Date
    end: Date
  }
  includeCategories?: string[]
  excludeCategories?: string[]
}

export class SimpleExportManager {
  // Export transactions to CSV
  static exportTransactionsCSV(transactions: any[]): string {
    if (transactions.length === 0) {
      return 'No transactions to export'
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    const rows = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.description || '',
      transaction.category || '',
      transaction.type || '',
      transaction.amount?.toString() || '0',
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Export budgets to CSV
  static exportBudgetsCSV(budgets: any[]): string {
    if (budgets.length === 0) {
      return 'No budgets to export'
    }

    const headers = ['Month', 'Category', 'Monthly Limit', 'Current Spent', 'Remaining', 'Utilization %']
    const rows = budgets.map((budget) => {
      const remaining = Number(budget.monthlyLimit) - Number(budget.currentSpent)
      const utilization = (Number(budget.currentSpent) / Number(budget.monthlyLimit)) * 100

      return [
        budget.month || '',
        budget.category || '',
        budget.monthlyLimit?.toString() || '0',
        budget.currentSpent?.toString() || '0',
        remaining.toString(),
        utilization.toFixed(2),
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Export loans to CSV
  static exportLoansCSV(loans: any[]): string {
    if (loans.length === 0) {
      return 'No loans to export'
    }

    const headers = ['Name', 'Initial Amount', 'Current Balance', 'Monthly Payment', 'Interest Rate %', 'Start Date']
    const rows = loans.map(loan => [
      loan.name || '',
      loan.initialAmount?.toString() || '0',
      loan.currentBalance?.toString() || '0',
      loan.monthlyPayment?.toString() || '0',
      loan.interestRate?.toString() || '0',
      loan.startDate ? new Date(loan.startDate).toLocaleDateString() : '',
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Export savings goals to CSV
  static exportSavingsGoalsCSV(savingsGoals: any[]): string {
    if (savingsGoals.length === 0) {
      return 'No savings goals to export'
    }

    const headers = ['Name', 'Target Amount', 'Current Amount', 'Monthly Contribution', 'Target Date', 'Progress %']
    const rows = savingsGoals.map((goal) => {
      const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100

      return [
        goal.name || '',
        goal.targetAmount?.toString() || '0',
        goal.currentAmount?.toString() || '0',
        goal.monthlyContribution?.toString() || '0',
        goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '',
        progress.toFixed(2),
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Export data as JSON
  static exportDataJSON(data: any): string {
    return JSON.stringify(data, null, 2)
  }

  // Download file helper
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // Generate filename with timestamp
  static generateFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().split('T')[0]
    return `${prefix}-${timestamp}.${extension}`
  }

  // Export all user data
  static async exportAllData(userId: string, format: 'csv' | 'json' = 'json'): Promise<void> {
    try {
      // Fetch all user data
      const [transactions, budgets, loans, savingsGoals] = await Promise.all([
        $fetch(`/api/transactions`, { headers: { 'x-user-id': userId } }),
        $fetch(`/api/budgets`, { headers: { 'x-user-id': userId } }),
        $fetch(`/api/loans`, { headers: { 'x-user-id': userId } }),
        $fetch(`/api/savings-goals`, { headers: { 'x-user-id': userId } }),
      ])

      if (format === 'csv') {
        // Export each data type as separate CSV files
        const transactionsCsv = this.exportTransactionsCSV(transactions)
        const budgetsCsv = this.exportBudgetsCSV(budgets)
        const loansCsv = this.exportLoansCSV(loans)
        const savingsGoalsCsv = this.exportSavingsGoalsCSV(savingsGoals)

        // Download each file
        this.downloadFile(transactionsCsv, this.generateFilename('transactions', 'csv'), 'text/csv')
        this.downloadFile(budgetsCsv, this.generateFilename('budgets', 'csv'), 'text/csv')
        this.downloadFile(loansCsv, this.generateFilename('loans', 'csv'), 'text/csv')
        this.downloadFile(savingsGoalsCsv, this.generateFilename('savings-goals', 'csv'), 'text/csv')
      }
      else {
        // Export as single JSON file
        const allData = {
          exportDate: new Date().toISOString(),
          userId,
          data: {
            transactions,
            budgets,
            loans,
            savingsGoals,
          },
        }

        const jsonContent = this.exportDataJSON(allData)
        this.downloadFile(jsonContent, this.generateFilename('financial-data', 'json'), 'application/json')
      }
    }
    catch (error) {
      console.error('Export failed:', error)
      throw new Error('Failed to export data')
    }
  }

  // Create financial summary report
  static generateFinancialSummary(data: {
    transactions: any[]
    budgets: any[]
    loans: any[]
    savingsGoals: any[]
  }): string {
    const { transactions, budgets, loans, savingsGoals } = data

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalDebt = loans
      .reduce((sum, l) => sum + Number(l.currentBalance), 0)

    const totalSavings = savingsGoals
      .reduce((sum, g) => sum + Number(g.currentAmount), 0)

    const netIncome = totalIncome - totalExpenses

    // Generate summary report
    const summary = `
FINANCIAL SUMMARY REPORT
Generated: ${new Date().toLocaleDateString()}

INCOME & EXPENSES
Total Income: ${formatCurrency(totalIncome)}
Total Expenses: ${formatCurrency(totalExpenses)}
Net Income: ${formatCurrency(netIncome)}

DEBT OVERVIEW
Total Debt: ${formatCurrency(totalDebt)}
Number of Loans: ${loans.length}

SAVINGS OVERVIEW
Total Savings: ${formatCurrency(totalSavings)}
Number of Goals: ${savingsGoals.length}

BUDGET OVERVIEW
Number of Budgets: ${budgets.length}
Total Budget Limits: ${formatCurrency(budgets.reduce((sum, b) => sum + Number(b.monthlyLimit), 0))}
Total Budget Spent: ${formatCurrency(budgets.reduce((sum, b) => sum + Number(b.currentSpent), 0))}

TRANSACTION BREAKDOWN
Total Transactions: ${transactions.length}
Income Transactions: ${transactions.filter(t => t.type === 'income').length}
Expense Transactions: ${transactions.filter(t => t.type === 'expense').length}
    `.trim()

    return summary
  }
}

// Export utility functions
export const exportUtils = {
  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) { return '0 Bytes' }
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / 1024 ** i * 100) / 100} ${sizes[i]}`
  },

  validateExportData: (data: any): boolean => {
    return data && typeof data === 'object' && Object.keys(data).length > 0
  },

  sanitizeFilename: (filename: string): string => {
    return filename.replace(/[^a-z0-9.-]/gi, '_')
  },
}
