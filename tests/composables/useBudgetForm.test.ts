import type { CreateBudgetInput } from '~/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBudgetForm } from '~/app/features/budgets/composables/useBudgetForm'

// Mock the useBudgets composable
vi.mock('~/app/features/budgets/composables/useBudgets', () => ({
  useBudgets: vi.fn(() => ({
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
  })),
}))

// Mock useToast
vi.mock('#app', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}))

describe('useBudgetForm', () => {
  let mockCreateBudget: any
  let mockUpdateBudget: any
  let mockToast: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    const { useBudgets } = await import('~/app/features/budgets/composables/useBudgets')
    const mockUseBudgets = vi.mocked(useBudgets)

    mockCreateBudget = vi.fn()
    mockUpdateBudget = vi.fn()

    mockUseBudgets.mockReturnValue({
      createBudget: mockCreateBudget,
      updateBudget: mockUpdateBudget,
      loading: { value: false },
      error: { value: null },
      fetchBudgets: vi.fn(),
      fetchBudget: vi.fn(),
      deleteBudget: vi.fn(),
      fetchAnalysis: vi.fn(),
      syncBudgets: vi.fn(),
      calculateMetrics: vi.fn(),
      getBudgetStatus: vi.fn(),
      generateAlerts: vi.fn(),
    })

    const { useToast } = await import('#app')
    mockToast = { add: vi.fn() }
    vi.mocked(useToast).mockReturnValue(mockToast)
  })

  describe('validateBudgetData', () => {
    it('should return no errors for valid data', () => {
      const { validateBudgetData } = useBudgetForm()

      const validData: CreateBudgetInput = {
        category: 'food',
        monthlyLimit: 100000,
        month: '2024-01',
      }

      const errors = validateBudgetData(validData)
      expect(errors).toHaveLength(0)
    })

    it('should return errors for invalid data', () => {
      const { validateBudgetData } = useBudgetForm()

      const invalidData = {
        category: '',
        monthlyLimit: -100,
        month: 'invalid',
      }

      const errors = validateBudgetData(invalidData)
      expect(errors).toContain('Category is required')
      expect(errors).toContain('Monthly limit must be positive')
      expect(errors).toContain('Month must be in YYYY-MM format')
    })
  })

  describe('isValidBudgetData', () => {
    it('should return true for valid data', () => {
      const { isValidBudgetData } = useBudgetForm()

      const validData: CreateBudgetInput = {
        category: 'food',
        monthlyLimit: 100000,
        month: '2024-01',
      }

      expect(isValidBudgetData(validData)).toBe(true)
    })

    it('should return false for invalid data', () => {
      const { isValidBudgetData } = useBudgetForm()

      const invalidData = {
        category: '',
        monthlyLimit: 0,
        month: '',
      }

      expect(isValidBudgetData(invalidData)).toBe(false)
    })
  })

  describe('submitBudget', () => {
    it('should create new budget successfully', async () => {
      const { submitBudget } = useBudgetForm()

      const budgetData: CreateBudgetInput = {
        category: 'food',
        monthlyLimit: 100000,
        month: '2024-01',
      }

      const mockBudget = {
        id: '1',
        userId: 'user1',
        ...budgetData,
        currentSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCreateBudget.mockResolvedValue(mockBudget)

      const result = await submitBudget(budgetData)

      expect(result.success).toBe(true)
      expect(result.budget).toEqual(mockBudget)
      expect(mockCreateBudget).toHaveBeenCalledWith(budgetData)
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Budget created successfully',
        color: 'success',
      })
    })

    it('should update existing budget successfully', async () => {
      const { submitBudget } = useBudgetForm()

      const budgetData: CreateBudgetInput = {
        category: 'food',
        monthlyLimit: 150000,
        month: '2024-01',
      }

      const mockBudget = {
        id: '1',
        userId: 'user1',
        ...budgetData,
        currentSpent: 25000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUpdateBudget.mockResolvedValue(mockBudget)

      const result = await submitBudget(budgetData, '1')

      expect(result.success).toBe(true)
      expect(result.budget).toEqual(mockBudget)
      expect(mockUpdateBudget).toHaveBeenCalledWith('1', {
        monthlyLimit: budgetData.monthlyLimit,
        month: budgetData.month,
      })
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Budget updated successfully',
        color: 'success',
      })
    })

    it('should handle API errors gracefully', async () => {
      const { submitBudget } = useBudgetForm()

      const budgetData: CreateBudgetInput = {
        category: 'food',
        monthlyLimit: 100000,
        month: '2024-01',
      }

      const errorMessage = 'Budget already exists'
      mockCreateBudget.mockRejectedValue(new Error(errorMessage))

      const result = await submitBudget(budgetData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create budget')
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Error',
        description: expect.stringContaining('Failed to create budget'),
        color: 'error',
      })
    })

    it('should handle null response from API', async () => {
      const { submitBudget } = useBudgetForm()

      const budgetData: CreateBudgetInput = {
        category: 'food',
        monthlyLimit: 100000,
        month: '2024-01',
      }

      mockCreateBudget.mockResolvedValue(null)

      const result = await submitBudget(budgetData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create budget')
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create budget',
        color: 'error',
      })
    })
  })
})
