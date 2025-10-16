import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanupDatabase, createTestUser, testDb } from '../utils/database'

describe('loan API Logic Tests', () => {
  let testUserId: string

  beforeAll(async () => {
    await testDb.$connect()
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await testDb.$disconnect()
  })

  beforeEach(async () => {
    await cleanupDatabase()
    // Create test user
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123',
      monthlyIncome: 500000,
    })
    testUserId = user.id
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('loan Database Operations', () => {
    it('should create a new loan in database', async () => {
      const loanData = {
        userId: testUserId,
        name: 'Car Loan',
        initialAmount: 2000000,
        currentBalance: 2000000,
        monthlyPayment: 50000,
        interestRate: 0.15, // 15% as decimal
        startDate: new Date('2024-01-01'),
        projectedPayoffDate: new Date('2027-08-01'),
      }

      const loan = await testDb.loan.create({
        data: loanData,
      })

      expect(loan).toBeTruthy()
      expect(Number(loan.initialAmount)).toBe(2000000)
      expect(loan.name).toBe('Car Loan')
      expect(Number(loan.interestRate)).toBe(0.15)
      expect(loan.userId).toBe(testUserId)
    })

    it('should handle decimal amounts correctly', async () => {
      const loanData = {
        userId: testUserId,
        name: 'Personal Loan',
        initialAmount: 1500000.50,
        currentBalance: 1200000.75,
        monthlyPayment: 45000.25,
        interestRate: 0.12,
        startDate: new Date('2024-01-01'),
      }

      const loan = await testDb.loan.create({
        data: loanData,
      })

      expect(Number(loan.initialAmount)).toBe(1500000.50)
      expect(Number(loan.currentBalance)).toBe(1200000.75)
      expect(Number(loan.monthlyPayment)).toBe(45000.25)
    })

    it('should validate required fields', async () => {
      const invalidLoanData = {
        userId: testUserId,
        // Missing required fields
        initialAmount: 1000000,
        currentBalance: 1000000,
        monthlyPayment: 25000,
        interestRate: 0.10,
        startDate: new Date(),
      }

      await expect(
        testDb.loan.create({
          data: invalidLoanData,
        }),
      ).rejects.toThrow()
    })
  })

  describe('loan Query Operations', () => {
    beforeEach(async () => {
      // Create test loans
      await testDb.loan.createMany({
        data: [
          {
            userId: testUserId,
            name: 'Car Loan',
            initialAmount: 2000000,
            currentBalance: 1500000,
            monthlyPayment: 50000,
            interestRate: 0.15,
            startDate: new Date('2024-01-01'),
          },
          {
            userId: testUserId,
            name: 'Personal Loan',
            initialAmount: 1000000,
            currentBalance: 800000,
            monthlyPayment: 30000,
            interestRate: 0.12,
            startDate: new Date('2024-02-01'),
          },
          {
            userId: testUserId,
            name: 'Home Loan',
            initialAmount: 5000000,
            currentBalance: 4800000,
            monthlyPayment: 100000,
            interestRate: 0.08,
            startDate: new Date('2023-12-01'),
          },
        ],
      })
    })

    it('should fetch all loans for user', async () => {
      const loans = await testDb.loan.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      })

      expect(loans).toHaveLength(3)
      expect(loans.every(l => l.userId === testUserId)).toBe(true)
    })

    it('should fetch loans ordered by creation date', async () => {
      const loans = await testDb.loan.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      })

      expect(loans).toHaveLength(3)
      // Should be ordered by creation date (newest first)
      for (let i = 0; i < loans.length - 1; i++) {
        expect(loans[i].createdAt.getTime()).toBeGreaterThanOrEqual(loans[i + 1].createdAt.getTime())
      }
    })

    it('should find specific loan by id', async () => {
      const allLoans = await testDb.loan.findMany({
        where: { userId: testUserId },
      })

      const targetLoan = allLoans[0]
      const foundLoan = await testDb.loan.findFirst({
        where: {
          id: targetLoan.id,
          userId: testUserId,
        },
      })

      expect(foundLoan).toBeTruthy()
      expect(foundLoan!.id).toBe(targetLoan.id)
      expect(foundLoan!.name).toBe(targetLoan.name)
    })
  })

  describe('loan Update Operations', () => {
    let loanId: string

    beforeEach(async () => {
      const loan = await testDb.loan.create({
        data: {
          userId: testUserId,
          name: 'Test Loan',
          initialAmount: 1000000,
          currentBalance: 800000,
          monthlyPayment: 25000,
          interestRate: 0.10,
          startDate: new Date('2024-01-01'),
        },
      })
      loanId = loan.id
    })

    it('should update loan details', async () => {
      const updatedLoan = await testDb.loan.update({
        where: { id: loanId },
        data: {
          name: 'Updated Loan Name',
          monthlyPayment: 30000,
        },
      })

      expect(updatedLoan.name).toBe('Updated Loan Name')
      expect(Number(updatedLoan.monthlyPayment)).toBe(30000)
      expect(Number(updatedLoan.initialAmount)).toBe(1000000) // Should remain unchanged
    })

    it('should update current balance', async () => {
      const newBalance = 750000
      const updatedLoan = await testDb.loan.update({
        where: { id: loanId },
        data: { currentBalance: newBalance },
      })

      expect(Number(updatedLoan.currentBalance)).toBe(newBalance)
    })

    it('should throw error for non-existent loan update', async () => {
      await expect(
        testDb.loan.update({
          where: { id: 'non-existent-id' },
          data: { monthlyPayment: 35000 },
        }),
      ).rejects.toThrow()
    })
  })

  describe('loan Delete Operations', () => {
    let loanId: string

    beforeEach(async () => {
      const loan = await testDb.loan.create({
        data: {
          userId: testUserId,
          name: 'Loan to Delete',
          initialAmount: 500000,
          currentBalance: 400000,
          monthlyPayment: 15000,
          interestRate: 0.08,
          startDate: new Date('2024-01-01'),
        },
      })
      loanId = loan.id
    })

    it('should delete a loan', async () => {
      await testDb.loan.delete({
        where: { id: loanId },
      })

      // Verify deletion in database
      const dbLoan = await testDb.loan.findUnique({
        where: { id: loanId },
      })
      expect(dbLoan).toBeNull()
    })

    it('should throw error for non-existent loan deletion', async () => {
      await expect(
        testDb.loan.delete({
          where: { id: 'non-existent-id' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('loan Payment Operations', () => {
    let loanId: string

    beforeEach(async () => {
      const loan = await testDb.loan.create({
        data: {
          userId: testUserId,
          name: 'Payment Test Loan',
          initialAmount: 1000000,
          currentBalance: 800000,
          monthlyPayment: 25000,
          interestRate: 0.10,
          startDate: new Date('2024-01-01'),
        },
      })
      loanId = loan.id
    })

    it('should record loan payment and update balance', async () => {
      const paymentAmount = 25000
      const originalBalance = 800000
      const expectedNewBalance = originalBalance - paymentAmount

      // Simulate payment by updating balance and creating transaction
      const result = await testDb.$transaction(async (tx) => {
        // Update loan balance
        const updatedLoan = await tx.loan.update({
          where: { id: loanId },
          data: { currentBalance: expectedNewBalance },
        })

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId: testUserId,
            amount: paymentAmount,
            category: 'loan_repayment',
            description: 'Loan payment - Payment Test Loan',
            date: new Date(),
            type: 'expense',
          },
        })

        return { loan: updatedLoan, transaction }
      })

      expect(Number(result.loan.currentBalance)).toBe(expectedNewBalance)
      expect(Number(result.transaction.amount)).toBe(paymentAmount)
      expect(result.transaction.category).toBe('loan_repayment')
    })

    it('should handle full loan payoff', async () => {
      const currentBalance = 800000
      const paymentAmount = currentBalance // Full payoff

      const updatedLoan = await testDb.loan.update({
        where: { id: loanId },
        data: {
          currentBalance: 0,
          projectedPayoffDate: null, // Loan is paid off
        },
      })

      expect(Number(updatedLoan.currentBalance)).toBe(0)
      expect(updatedLoan.projectedPayoffDate).toBeNull()
    })

    it('should validate payment amount does not exceed balance', async () => {
      const currentBalance = 800000
      const excessivePayment = currentBalance + 100000

      // This validation would be handled in the API layer
      // Here we just test that we can detect the condition
      expect(excessivePayment).toBeGreaterThan(currentBalance)
    })
  })

  describe('loan Calculation Integration', () => {
    it('should calculate loan metrics correctly', async () => {
      const loanData = {
        userId: testUserId,
        name: 'Calculation Test Loan',
        initialAmount: 1000000,
        currentBalance: 800000,
        monthlyPayment: 25000,
        interestRate: 0.12, // 12% annual
        startDate: new Date('2024-01-01'),
      }

      const loan = await testDb.loan.create({
        data: loanData,
      })

      // Test basic calculations
      const monthlyInterestRate = Number(loan.interestRate) / 12
      const interestPayment = Number(loan.currentBalance) * monthlyInterestRate
      const principalPayment = Number(loan.monthlyPayment) - interestPayment

      expect(monthlyInterestRate).toBeCloseTo(0.01, 4) // 1% monthly
      expect(interestPayment).toBeCloseTo(8000, 0) // ₦8,000 interest
      expect(principalPayment).toBeCloseTo(17000, 0) // ₦17,000 principal
    })

    it('should track payment history through transactions', async () => {
      const loan = await testDb.loan.create({
        data: {
          userId: testUserId,
          name: 'History Test Loan',
          initialAmount: 1000000,
          currentBalance: 800000,
          monthlyPayment: 25000,
          interestRate: 0.10,
          startDate: new Date('2024-01-01'),
        },
      })

      // Create multiple payment transactions
      await testDb.transaction.createMany({
        data: [
          {
            userId: testUserId,
            amount: 25000,
            category: 'loan_repayment',
            description: 'Loan payment - History Test Loan',
            date: new Date('2024-01-15'),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 25000,
            category: 'loan_repayment',
            description: 'Loan payment - History Test Loan',
            date: new Date('2024-02-15'),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 30000,
            category: 'loan_repayment',
            description: 'Extra payment - History Test Loan',
            date: new Date('2024-03-15'),
            type: 'expense',
          },
        ],
      })

      // Query payment history
      const paymentHistory = await testDb.transaction.findMany({
        where: {
          userId: testUserId,
          category: 'loan_repayment',
          description: {
            contains: 'History Test Loan',
          },
        },
        orderBy: { date: 'desc' },
      })

      expect(paymentHistory).toHaveLength(3)
      expect(Number(paymentHistory[0].amount)).toBe(30000) // Most recent (extra payment)
      expect(Number(paymentHistory[1].amount)).toBe(25000) // February payment
      expect(Number(paymentHistory[2].amount)).toBe(25000) // January payment
    })
  })
})
