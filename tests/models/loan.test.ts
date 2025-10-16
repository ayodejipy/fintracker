import { describe, expect, it } from 'vitest'
import { createTestLoan, createTestUser, setupTestDatabase, testDb } from '../utils/database'

describe('loan Model', () => {
  setupTestDatabase()

  describe('loan Creation', () => {
    it('should create a loan with valid data', async () => {
      const user = await createTestUser()
      const loanData = {
        userId: user.id,
        name: 'Car Loan',
        initialAmount: 2000000,
        currentBalance: 1500000,
        monthlyPayment: 100000,
        interestRate: 0.15,
        startDate: new Date('2023-06-01'),
      }

      const loan = await testDb.loan.create({
        data: loanData,
      })

      expect(loan).toMatchObject({
        userId: user.id,
        name: loanData.name,
        initialAmount: expect.any(Object), // Prisma Decimal
        currentBalance: expect.any(Object), // Prisma Decimal
        monthlyPayment: expect.any(Object), // Prisma Decimal
        interestRate: expect.any(Object), // Prisma Decimal
        startDate: loanData.startDate,
      })
      expect(loan.id).toBeDefined()
      expect(loan.createdAt).toBeInstanceOf(Date)
      expect(loan.updatedAt).toBeInstanceOf(Date)
    })

    it('should set default interest rate to 0', async () => {
      const user = await createTestUser()
      const loan = await testDb.loan.create({
        data: {
          userId: user.id,
          name: 'Interest-free Loan',
          initialAmount: 100000,
          currentBalance: 80000,
          monthlyPayment: 10000,
          startDate: new Date(),
        },
      })

      expect(Number(loan.interestRate)).toBe(0)
    })

    it('should allow projected payoff date to be null', async () => {
      const user = await createTestUser()
      const loan = await testDb.loan.create({
        data: {
          userId: user.id,
          name: 'Flexible Loan',
          initialAmount: 100000,
          currentBalance: 80000,
          monthlyPayment: 10000,
          startDate: new Date(),
          projectedPayoffDate: null,
        },
      })

      expect(loan.projectedPayoffDate).toBeNull()
    })
  })

  describe('loan Relationships', () => {
    it('should belong to a user', async () => {
      const user = await createTestUser()
      const loan = await createTestLoan(user.id)

      const loanWithUser = await testDb.loan.findUnique({
        where: { id: loan.id },
        include: { user: true },
      })

      expect(loanWithUser?.user.id).toBe(user.id)
      expect(loanWithUser?.user.email).toBe(user.email)
    })
  })

  describe('loan Queries', () => {
    it('should filter loans by user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' })
      const user2 = await createTestUser({ email: 'user2@example.com' })

      await createTestLoan(user1.id, { name: 'User 1 Loan' })
      await createTestLoan(user2.id, { name: 'User 2 Loan' })

      const user1Loans = await testDb.loan.findMany({
        where: { userId: user1.id },
      })

      expect(user1Loans).toHaveLength(1)
      expect(user1Loans[0].name).toBe('User 1 Loan')
    })

    it('should order loans by creation date', async () => {
      const user = await createTestUser()

      const loan1 = await createTestLoan(user.id, { name: 'First Loan' })
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      const loan2 = await createTestLoan(user.id, { name: 'Second Loan' })

      const loans = await testDb.loan.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      expect(loans[0].name).toBe('Second Loan')
      expect(loans[1].name).toBe('First Loan')
    })
  })

  describe('loan Updates', () => {
    it('should update current balance', async () => {
      const user = await createTestUser()
      const loan = await createTestLoan(user.id, {
        currentBalance: 100000,
      })

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      const updatedLoan = await testDb.loan.update({
        where: { id: loan.id },
        data: { currentBalance: 90000 },
      })

      expect(Number(updatedLoan.currentBalance)).toBe(90000)
      expect(updatedLoan.updatedAt.getTime()).toBeGreaterThan(loan.updatedAt.getTime())
    })

    it('should update projected payoff date', async () => {
      const user = await createTestUser()
      const loan = await createTestLoan(user.id)
      const newPayoffDate = new Date('2025-12-31')

      const updatedLoan = await testDb.loan.update({
        where: { id: loan.id },
        data: { projectedPayoffDate: newPayoffDate },
      })

      expect(updatedLoan.projectedPayoffDate).toEqual(newPayoffDate)
    })
  })

  describe('loan Calculations', () => {
    it('should handle loan with zero interest rate', async () => {
      const user = await createTestUser()
      const loan = await createTestLoan(user.id, {
        initialAmount: 120000,
        currentBalance: 120000,
        monthlyPayment: 10000,
        interestRate: 0,
      })

      expect(Number(loan.interestRate)).toBe(0)
      expect(Number(loan.currentBalance)).toBe(120000)
      expect(Number(loan.monthlyPayment)).toBe(10000)
    })

    it('should handle loan with high interest rate', async () => {
      const user = await createTestUser()
      const loan = await createTestLoan(user.id, {
        interestRate: 0.25, // 25% annual
      })

      expect(Number(loan.interestRate)).toBe(0.25)
    })
  })
})
