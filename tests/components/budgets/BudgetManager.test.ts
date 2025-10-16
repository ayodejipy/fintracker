import type { Budget } from '~/types'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BudgetManager from '~/app/features/budgets/components/BudgetManager.vue'

// Mock the composables and utilities
vi.mock('~/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number) => `₦${amount.toLocaleString()}`),
}))

vi.mock('~/utils/categories', () => ({
  getCategoryOptions: vi.fn(() => [
    { value: 'food', label: 'Food & Groceries' },
    { value: 'transport', label: 'Transport' },
    { value: 'rent', label: 'Rent' },
  ]),
  getCategoryDisplayName: vi.fn((category: string) => category),
  getCategoryColor: vi.fn(() => '#3b82f6'),
}))

// Mock Nuxt composables
vi.mock('#app', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}))

// Mock $fetch
global.$fetch = vi.fn()

describe('budgetManager', () => {
  const mockBudgets: Budget[] = [
    {
      id: '1',
      userId: 'user1',
      category: 'food',
      monthlyLimit: 100000,
      currentSpent: 45000,
      month: '2024-01',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      userId: 'user1',
      category: 'transport',
      monthlyLimit: 50000,
      currentSpent: 60000, // Over budget
      month: '2024-01',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    vi.mocked($fetch).mockResolvedValue({
      success: true,
      data: mockBudgets,
    })
  })

  it('should render the budget manager component', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    expect(wrapper.find('h2').text()).toBe('Budget Manager')
    expect(wrapper.find('p').text()).toBe('Track and manage your monthly budgets')
  })

  it('should display budget overview cards', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    // Should have 4 overview cards
    const cards = wrapper.findAll('[data-testid="overview-card"]')
    expect(cards).toHaveLength(4)
  })

  it('should calculate total budget correctly', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    // Total budget should be 150000 (100000 + 50000)
    expect(wrapper.vm.totalBudget).toBe(150000)
  })

  it('should calculate total spent correctly', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    // Total spent should be 105000 (45000 + 60000)
    expect(wrapper.vm.totalSpent).toBe(105000)
  })

  it('should calculate utilization rate correctly', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    // Utilization rate should be 70% (105000 / 150000 * 100)
    expect(wrapper.vm.utilizationRate).toBe(70)
  })

  it('should show add budget button', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: [],
        currentMonth: '2024-01',
      },
    })

    const addButton = wrapper.find('[data-testid="add-budget-btn"]')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('Add Budget')
  })

  it('should display budget items when available', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    // Should display budget items
    const budgetItems = wrapper.findAll('[data-testid="budget-item"]')
    expect(budgetItems.length).toBeGreaterThan(0)
  })

  it('should show empty state when no budgets', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: [],
        currentMonth: '2024-01',
      },
    })

    const emptyState = wrapper.find('[data-testid="empty-state"]')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('No budgets set for this month')
  })

  it('should handle loading state', async () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: [],
        currentMonth: '2024-01',
      },
    })

    // Set loading state
    await wrapper.setData({ loading: true })

    const loadingIndicator = wrapper.find('[data-testid="loading"]')
    expect(loadingIndicator.exists()).toBe(true)
  })

  it('should filter available categories correctly', () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    // Should exclude 'food' and 'transport' since they're already used
    const availableCategories = wrapper.vm.availableCategories
    expect(availableCategories.some(cat => cat.value === 'food')).toBe(false)
    expect(availableCategories.some(cat => cat.value === 'transport')).toBe(false)
    expect(availableCategories.some(cat => cat.value === 'rent')).toBe(true)
  })
})

describe('budgetManager Integration', () => {
  it('should call API when month changes', async () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: [],
        currentMonth: '2024-01',
      },
    })

    // Change selected month
    await wrapper.setData({ selectedMonth: '2024-02' })

    // Should trigger API call
    expect($fetch).toHaveBeenCalledWith('/api/budgets', {
      query: expect.objectContaining({
        month: '2024-02',
      }),
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked($fetch).mockRejectedValue(new Error('API Error'))

    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: [],
        currentMonth: '2024-01',
      },
    })

    // Should not crash and should show error handling
    expect(wrapper.exists()).toBe(true)
  })

  it('should sync budgets when sync button is clicked', async () => {
    const wrapper = mount(BudgetManager, {
      props: {
        initialBudgets: mockBudgets,
        currentMonth: '2024-01',
      },
    })

    const syncButton = wrapper.find('[data-testid="sync-button"]')
    await syncButton.trigger('click')

    // Should call sync API
    expect($fetch).toHaveBeenCalledWith('/api/budgets/sync', {
      method: 'POST',
      body: expect.objectContaining({
        month: '2024-01',
      }),
    })
  })
})
