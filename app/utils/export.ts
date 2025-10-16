import type { Budget, Loan, SavingsGoal, Transaction } from '~/types'
import { formatCurrency, formatNigerianDate } from './currency'

// CSV Export utilities
export class CSVExporter {
  private static escapeCSV(value: any): string {
    if (value === null || value === undefined) { return '' }

    const str = String(value)
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  private static arrayToCSV(data: any[], headers: string[]): string {
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row =>
      headers.map(header => this.escapeCSV(row[header])).join(','),
    )
    return [csvHeaders, ...csvRows].join('\n')
  }

  static exportTransactions(transactions: Transaction[]): string {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency']

    const data = transactions.map(transaction => ({
      Date: formatNigerianDate(transaction.date),
      Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      Category: transaction.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      Description: transaction.description,
      Amount: transaction.amount,
      Currency: 'NGN', // Default currency, could be dynamic
    }))

    return this.arrayToCSV(data, headers)
  }

  static exportBudgets(budgets: Budget[]): string {
    const headers = ['Month', 'Category', 'Budget Limit', 'Current Spent', 'Remaining', 'Utilization %']

    const data = budgets.map((budget) => {
      const remaining = budget.monthlyLimit - budget.currentSpent
      const utilization = budget.monthlyLimit > 0
        ? Math.round((budget.currentSpent / budget.monthlyLimit) * 100)
        : 0

      return {
        'Month': budget.month,
        'Category': budget.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        'Budget Limit': budget.monthlyLimit,
        'Current Spent': budget.currentSpent,
        'Remaining': remaining,
        'Utilization %': utilization,
      }
    })

    return this.arrayToCSV(data, headers)
  }

  static exportLoans(loans: Loan[]): string {
    const headers = ['Loan Name', 'Initial Amount', 'Current Balance', 'Monthly Payment', 'Interest Rate %', 'Start Date', 'Projected Payoff']

    const data = loans.map(loan => ({
      'Loan Name': loan.name,
      'Initial Amount': loan.initialAmount,
      'Current Balance': loan.currentBalance,
      'Monthly Payment': loan.monthlyPayment,
      'Interest Rate %': loan.interestRate,
      'Start Date': formatNigerianDate(loan.startDate),
      'Projected Payoff': loan.projectedPayoffDate ? formatNigerianDate(loan.projectedPayoffDate) : 'Not calculated',
    }))

    return this.arrayToCSV(data, headers)
  }

  static exportSavingsGoals(goals: SavingsGoal[]): string {
    const headers = ['Goal Name', 'Target Amount', 'Current Amount', 'Monthly Contribution', 'Target Date', 'Progress %']

    const data = goals.map((goal) => {
      const progress = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0

      return {
        'Goal Name': goal.name,
        'Target Amount': goal.targetAmount,
        'Current Amount': goal.currentAmount,
        'Monthly Contribution': goal.monthlyContribution,
        'Target Date': formatNigerianDate(goal.targetDate),
        'Progress %': progress,
      }
    })

    return this.arrayToCSV(data, headers)
  }

  static exportFinancialSummary(data: {
    totalIncome: number
    totalExpenses: number
    netIncome: number
    budgetUtilization: number
    totalLoans: number
    totalSavings: number
    period: string
  }): string {
    const headers = ['Metric', 'Amount', 'Period']

    const summaryData = [
      { Metric: 'Total Income', Amount: formatCurrency(data.totalIncome), Period: data.period },
      { Metric: 'Total Expenses', Amount: formatCurrency(data.totalExpenses), Period: data.period },
      { Metric: 'Net Income', Amount: formatCurrency(data.netIncome), Period: data.period },
      { Metric: 'Budget Utilization', Amount: `${data.budgetUtilization}%`, Period: data.period },
      { Metric: 'Total Loan Balance', Amount: formatCurrency(data.totalLoans), Period: data.period },
      { Metric: 'Total Savings', Amount: formatCurrency(data.totalSavings), Period: data.period },
    ]

    return this.arrayToCSV(summaryData, headers)
  }
}

// PDF Export utilities (using HTML to PDF approach)
export class PDFExporter {
  private static generateHTMLReport(title: string, content: string, styles?: string): string {
    const defaultStyles = `
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333; 
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #007bff; 
          padding-bottom: 10px; 
        }
        .title { 
          color: #007bff; 
          font-size: 24px; 
          margin: 0; 
        }
        .subtitle { 
          color: #666; 
          font-size: 14px; 
          margin: 5px 0 0 0; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #f8f9fa; 
          font-weight: bold; 
        }
        .summary-card { 
          background: #f8f9fa; 
          border: 1px solid #dee2e6; 
          border-radius: 5px; 
          padding: 15px; 
          margin: 10px 0; 
        }
        .amount { 
          font-weight: bold; 
          color: #28a745; 
        }
        .expense { 
          color: #dc3545; 
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 12px; 
          color: #666; 
        }
      </style>
    `

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        ${defaultStyles}
        ${styles || ''}
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          <p class="subtitle">Generated on ${formatNigerianDate(new Date())}</p>
        </div>
        ${content}
        <div class="footer">
          <p>Personal Finance Dashboard - Confidential Report</p>
        </div>
      </body>
      </html>
    `
  }

  static generateTransactionReport(transactions: Transaction[], period: string): string {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const content = `
      <div class="summary-card">
        <h3>Transaction Summary - ${period}</h3>
        <p><strong>Total Income:</strong> <span class="amount">${formatCurrency(totalIncome)}</span></p>
        <p><strong>Total Expenses:</strong> <span class="amount expense">${formatCurrency(totalExpenses)}</span></p>
        <p><strong>Net Income:</strong> <span class="amount">${formatCurrency(totalIncome - totalExpenses)}</span></p>
        <p><strong>Total Transactions:</strong> ${transactions.length}</p>
      </div>

      <h3>Transaction Details</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(transaction => `
            <tr>
              <td>${formatNigerianDate(transaction.date)}</td>
              <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
              <td>${transaction.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              <td>${transaction.description}</td>
              <td class="${transaction.type === 'expense' ? 'expense' : 'amount'}">
                ${formatCurrency(transaction.amount)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    return this.generateHTMLReport(`Transaction Report - ${period}`, content)
  }

  static generateBudgetReport(budgets: Budget[], period: string): string {
    const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.currentSpent, 0)
    const overBudgetCount = budgets.filter(b => b.currentSpent > b.monthlyLimit).length

    const content = `
      <div class="summary-card">
        <h3>Budget Summary - ${period}</h3>
        <p><strong>Total Budget:</strong> <span class="amount">${formatCurrency(totalBudget)}</span></p>
        <p><strong>Total Spent:</strong> <span class="amount ${totalSpent > totalBudget ? 'expense' : ''}">${formatCurrency(totalSpent)}</span></p>
        <p><strong>Remaining:</strong> <span class="amount">${formatCurrency(totalBudget - totalSpent)}</span></p>
        <p><strong>Overall Utilization:</strong> ${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</p>
        <p><strong>Over-Budget Categories:</strong> ${overBudgetCount}</p>
      </div>

      <h3>Budget Details</h3>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Budget Limit</th>
            <th>Current Spent</th>
            <th>Remaining</th>
            <th>Utilization</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${budgets.map((budget) => {
            const remaining = budget.monthlyLimit - budget.currentSpent
            const utilization = budget.monthlyLimit > 0
              ? Math.round((budget.currentSpent / budget.monthlyLimit) * 100)
              : 0
            const isOverBudget = budget.currentSpent > budget.monthlyLimit

            return `
              <tr>
                <td>${budget.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td class="amount">${formatCurrency(budget.monthlyLimit)}</td>
                <td class="amount ${isOverBudget ? 'expense' : ''}">${formatCurrency(budget.currentSpent)}</td>
                <td class="amount ${remaining < 0 ? 'expense' : ''}">${formatCurrency(remaining)}</td>
                <td>${utilization}%</td>
                <td style="color: ${isOverBudget ? '#dc3545' : utilization > 80 ? '#ffc107' : '#28a745'}">
                  ${isOverBudget ? 'Over Budget' : utilization > 80 ? 'Warning' : 'On Track'}
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `

    return this.generateHTMLReport(`Budget Report - ${period}`, content)
  }

  static generateFinancialOverview(data: {
    transactions: Transaction[]
    budgets: Budget[]
    loans: Loan[]
    savingsGoals: SavingsGoal[]
    period: string
  }): string {
    const totalIncome = data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalLoanBalance = data.loans.reduce((sum, l) => sum + l.currentBalance, 0)
    const totalSavings = data.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)

    const content = `
      <div class="summary-card">
        <h3>Financial Overview - ${data.period}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h4>Income & Expenses</h4>
            <p><strong>Total Income:</strong> <span class="amount">${formatCurrency(totalIncome)}</span></p>
            <p><strong>Total Expenses:</strong> <span class="amount expense">${formatCurrency(totalExpenses)}</span></p>
            <p><strong>Net Income:</strong> <span class="amount">${formatCurrency(totalIncome - totalExpenses)}</span></p>
          </div>
          <div>
            <h4>Assets & Liabilities</h4>
            <p><strong>Total Savings:</strong> <span class="amount">${formatCurrency(totalSavings)}</span></p>
            <p><strong>Total Debt:</strong> <span class="amount expense">${formatCurrency(totalLoanBalance)}</span></p>
            <p><strong>Net Worth:</strong> <span class="amount">${formatCurrency(totalSavings - totalLoanBalance)}</span></p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div class="summary-card">
          <h4>Budget Performance</h4>
          <p><strong>Active Budgets:</strong> ${data.budgets.length}</p>
          <p><strong>Over-Budget Categories:</strong> ${data.budgets.filter(b => b.currentSpent > b.monthlyLimit).length}</p>
        </div>
        <div class="summary-card">
          <h4>Savings Goals</h4>
          <p><strong>Active Goals:</strong> ${data.savingsGoals.length}</p>
          <p><strong>Average Progress:</strong> ${data.savingsGoals.length > 0
            ? Math.round(data.savingsGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount * 100), 0) / data.savingsGoals.length)
            : 0}%</p>
        </div>
      </div>
    `

    return this.generateHTMLReport(`Financial Overview - ${data.period}`, content)
  }
}

// Export service for handling file downloads
export class ExportService {
  static downloadCSV(content: string, filename: string): void {
    if (typeof window === 'undefined') { return }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  static downloadPDF(htmlContent: string, _filename: string): void {
    if (typeof window === 'undefined') { return }

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      // Auto-trigger print dialog
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  static async exportUserData(userId: string, format: 'csv' | 'pdf' = 'csv', dataType: 'all' | 'transactions' | 'budgets' | 'loans' | 'savings' = 'all') {
    try {
      const response = await $fetch(`/api/export/${dataType}`, {
        method: 'GET',
        query: { format, userId },
        headers: {
          Accept: format === 'csv' ? 'text/csv' : 'text/html',
        },
      })

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `financial-${dataType}-${timestamp}.${format === 'csv' ? 'csv' : 'html'}`

      if (format === 'csv') {
        this.downloadCSV(response, filename)
      }
      else {
        this.downloadPDF(response, filename)
      }

      return { success: true, filename }
    }
    catch (error) {
      console.error('Export failed:', error)
      return { success: false, error: 'Export failed' }
    }
  }
}

// Backup utilities
export class BackupService {
  static async createFullBackup(userId: string): Promise<{ success: boolean, data?: any, error?: string }> {
    try {
      const response = await $fetch(`/api/backup/create`, {
        method: 'POST',
        body: { userId },
      })

      return { success: true, data: response }
    }
    catch (error) {
      console.error('Backup creation failed:', error)
      return { success: false, error: 'Backup creation failed' }
    }
  }

  static async restoreFromBackup(userId: string, backupData: any): Promise<{ success: boolean, error?: string }> {
    try {
      await $fetch(`/api/backup/restore`, {
        method: 'POST',
        body: { userId, backupData },
      })

      return { success: true }
    }
    catch (error) {
      console.error('Backup restoration failed:', error)
      return { success: false, error: 'Backup restoration failed' }
    }
  }

  static downloadBackup(backupData: unknown, userId: string): void {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `financial-backup-${userId}-${timestamp}.json`

    const content = JSON.stringify(backupData, null, 2)
    ExportService.downloadCSV(content, filename) // Reuse CSV download for JSON
  }
}
