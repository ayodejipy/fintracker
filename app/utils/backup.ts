import { prisma as db } from './database'

export interface BackupData {
  version: string
  timestamp: string
  userId: string
  data: {
    user: any
    transactions: any[]
    budgets: any[]
    loans: any[]
    savingsGoals: any[]
    notifications: any[]
  }
}

export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0.0'

  // Create a complete backup of user data
  static async createBackup(userId: string): Promise<BackupData> {
    try {
      // Fetch all user data in parallel
      const [user, transactions, budgets, loans, savingsGoals, notifications] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        db.transaction.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
        }),

        db.budget.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),

        db.loan.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),

        db.savingsGoal.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),

        db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to last 100 notifications
        }),
      ])

      if (!user) {
        throw new Error('User not found')
      }

      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        userId,
        data: {
          user,
          transactions,
          budgets,
          loans,
          savingsGoals,
          notifications,
        },
      }

      return backup
    }
    catch (error) {
      console.error('Failed to create backup:', error)
      throw new Error('Failed to create backup')
    }
  }

  // Restore user data from backup
  static async restoreBackup(userId: string, backupData: BackupData): Promise<void> {
    if (backupData.userId !== userId) {
      throw new Error('Backup user ID does not match current user')
    }

    if (!this.isValidBackup(backupData)) {
      throw new Error('Invalid backup data format')
    }

    try {
      await db.$transaction(async (tx) => {
        // Clear existing data (except user record)
        await Promise.all([
          tx.transaction.deleteMany({ where: { userId } }),
          tx.budget.deleteMany({ where: { userId } }),
          tx.loan.deleteMany({ where: { userId } }),
          tx.savingsGoal.deleteMany({ where: { userId } }),
          tx.notification.deleteMany({ where: { userId } }),
        ])

        // Restore transactions
        if (backupData.data.transactions.length > 0) {
          await tx.transaction.createMany({
            data: backupData.data.transactions.map(t => ({
              ...t,
              id: undefined, // Let database generate new IDs
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              date: new Date(t.date),
            })),
          })
        }

        // Restore budgets
        if (backupData.data.budgets.length > 0) {
          await tx.budget.createMany({
            data: backupData.data.budgets.map(b => ({
              ...b,
              id: undefined,
              createdAt: new Date(b.createdAt),
              updatedAt: new Date(b.updatedAt),
            })),
          })
        }

        // Restore loans
        if (backupData.data.loans.length > 0) {
          await tx.loan.createMany({
            data: backupData.data.loans.map(l => ({
              ...l,
              id: undefined,
              createdAt: new Date(l.createdAt),
              updatedAt: new Date(l.updatedAt),
              startDate: new Date(l.startDate),
            })),
          })
        }

        // Restore savings goals
        if (backupData.data.savingsGoals.length > 0) {
          await tx.savingsGoal.createMany({
            data: backupData.data.savingsGoals.map(s => ({
              ...s,
              id: undefined,
              createdAt: new Date(s.createdAt),
              updatedAt: new Date(s.updatedAt),
              targetDate: s.targetDate ? new Date(s.targetDate) : null,
            })),
          })
        }

        // Restore notifications (optional)
        if (backupData.data.notifications.length > 0) {
          await tx.notification.createMany({
            data: backupData.data.notifications.map(n => ({
              ...n,
              id: undefined,
              createdAt: new Date(n.createdAt),
              updatedAt: new Date(n.updatedAt),
            })),
          })
        }
      })
    }
    catch (error) {
      console.error('Failed to restore backup:', error)
      throw new Error('Failed to restore backup')
    }
  }

  // Validate backup data structure
  private static isValidBackup(backup: any): backup is BackupData {
    return (
      backup
      && typeof backup.version === 'string'
      && typeof backup.timestamp === 'string'
      && typeof backup.userId === 'string'
      && backup.data
      && backup.data.user
      && Array.isArray(backup.data.transactions)
      && Array.isArray(backup.data.budgets)
      && Array.isArray(backup.data.loans)
      && Array.isArray(backup.data.savingsGoals)
      && Array.isArray(backup.data.notifications)
    )
  }

  // Generate backup summary for display
  static generateBackupSummary(backup: BackupData) {
    const { data } = backup

    return {
      version: backup.version,
      timestamp: backup.timestamp,
      user: {
        email: data.user.email,
        name: data.user.name,
        currency: data.user.currency,
      },
      counts: {
        transactions: data.transactions.length,
        budgets: data.budgets.length,
        loans: data.loans.length,
        savingsGoals: data.savingsGoals.length,
        notifications: data.notifications.length,
      },
      totals: {
        totalIncome: data.transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalExpenses: data.transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalDebt: data.loans
          .reduce((sum, l) => sum + Number(l.currentBalance), 0),
        totalSavings: data.savingsGoals
          .reduce((sum, s) => sum + Number(s.currentAmount), 0),
      },
    }
  }

  // Export backup as downloadable file
  static exportBackupFile(backup: BackupData, filename?: string): void {
    const defaultFilename = `finance-backup-${new Date().toISOString().split('T')[0]}.json`
    const finalFilename = filename || defaultFilename

    const dataStr = JSON.stringify(backup, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // Import backup from file
  static async importBackupFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const backup = JSON.parse(content)

          if (!this.isValidBackup(backup)) {
            reject(new Error('Invalid backup file format'))
            return
          }

          resolve(backup)
        }
        catch {
          reject(new Error('Failed to parse backup file'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read backup file'))
      }

      reader.readAsText(file)
    })
  }

  // Create automated backup schedule
  static async scheduleBackup(userId: string, intervalHours: number = 24): Promise<void> {
    // This would typically integrate with a job scheduler
    // For now, we'll just log the schedule
    console.log(`Backup scheduled for user ${userId} every ${intervalHours} hours`)

    // In a real implementation, you might:
    // 1. Store the schedule in the database
    // 2. Use a job queue like Bull or Agenda
    // 3. Set up cron jobs
    // 4. Use cloud functions with scheduled triggers
  }

  // Get backup history (if stored)
  static async getBackupHistory(_userId: string): Promise<any[]> {
    // This would typically query a backups table
    // For now, return empty array
    return []
  }

  // Verify backup integrity
  static async verifyBackup(backup: BackupData): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    // Check version compatibility
    if (backup.version !== this.BACKUP_VERSION) {
      errors.push(`Backup version ${backup.version} may not be compatible with current version ${this.BACKUP_VERSION}`)
    }

    // Check data integrity
    const { data } = backup

    if (!data.user.id || !data.user.email) {
      errors.push('Invalid user data in backup')
    }

    // Validate transactions
    for (const transaction of data.transactions) {
      if (!transaction.amount || !transaction.type || !transaction.date) {
        errors.push('Invalid transaction data found')
        break
      }
    }

    // Validate budgets
    for (const budget of data.budgets) {
      if (!budget.category || !budget.monthlyLimit) {
        errors.push('Invalid budget data found')
        break
      }
    }

    // Validate loans
    for (const loan of data.loans) {
      if (!loan.name || !loan.initialAmount || !loan.currentBalance) {
        errors.push('Invalid loan data found')
        break
      }
    }

    // Validate savings goals
    for (const goal of data.savingsGoals) {
      if (!goal.name || !goal.targetAmount) {
        errors.push('Invalid savings goal data found')
        break
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// Utility functions for backup management
export const backupUtils = {
  formatBackupSize: (backup: BackupData): string => {
    const sizeInBytes = new Blob([JSON.stringify(backup)]).size
    const sizeInKB = sizeInBytes / 1024
    const sizeInMB = sizeInKB / 1024

    if (sizeInMB > 1) {
      return `${sizeInMB.toFixed(2)} MB`
    }
    else if (sizeInKB > 1) {
      return `${sizeInKB.toFixed(2)} KB`
    }
    else {
      return `${sizeInBytes} bytes`
    }
  },

  formatBackupDate: (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  },

  generateBackupFilename: (userEmail: string): string => {
    const date = new Date().toISOString().split('T')[0]
    const sanitizedEmail = userEmail.replace(/[^a-z0-9]/gi, '_')
    return `finance-backup-${sanitizedEmail}-${date}.json`
  },
}
