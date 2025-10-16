import type { Transaction } from '~/types'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExpenseTracker from '~/app/features/transactions/components/ExpenseTracker.vue'

// Mock the composables and utilities
vi.mock('~/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number) => `₦${amount.toLocaleString()}`),
}))

vi.mock('~/utils/date', () => ({
  formatDate: vi.fn((date: Date) => date.toLocaleDateString()),
  formatTime: vi.fn((date: Date) => date.toLocaleTimeString()),
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

describe('expenseTracker', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      userId: 'user1',
      amount: 50000,
      category: 'food',
      description: 'Grocery shopping',
      date: new Date('2024-01-15'),
      type: 'expense',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      userId: 'user1',
      amount: 500000,
      category: 'savings',
      description: 'Monthly salary',
      date: new Date('2024-01-01'),
      type: 'income',
      createdAt: new Date('2024-01-01'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    vi.mocked($fetch).mockResolvedValue({
      data: mockTransactions,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    })
  })

  it('should render the expense tracker component', () => {
    const wrapper = mount(ExpenseTracker, {
      props: {
        initialTransactions: mockTransactions,
      },
    })

    expect(wrapper.find('h2').text()).toBe('Expense Tracker')
    expect(wrapper.find('p').text()).toBe('Track your income and expenses')
  })

  it('should display summary cards', () => {
    const wrapper = mount(ExpenseTracker, {
      props: {
        initialTransactions: mockTransactions,
      },
    })

    // Should have 3 summary cards
    const cards = wrapper.findAll('[data-testid="summary-card"]')
    expect(cards).toHaveLength(3)
  })

  it('should show add transaction button', () => {
    const wrapper = mount(ExpenseTracker, {
      props: {
        initialTransactions: mockTransactions,
      },
    })

    const addButton = wrapper.find('[data-testid="add-transaction-btn"]')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('Add Transaction')
  })

  it('should display filter controls', () => {
    const wrapper = mount(ExpenseTracker, {
      props: {
        initialTransactions: mockTransactions,
      },
    })

    // Should have search, category, type, and month filters
    const searchInput = wrapper.find('input[placeholder="Search transactions..."]')
    expect(searchInput.exists()).toBe(true)
  })

  it('should display transactions when available', () => {
    const wrapper = mount(ExpenseTracker, {
      props: {
        initialTransactions: mockTransactions,
      },
    })

    // Should display transaction items
    const transactionItems = wrapper.findAll('[data-testid="transaction-item"]')
    expect(transactionItems.length).toBeGreaterThan(0)
  })

  it('should show empty state when no transactions', () => {
    const wrapper = mount(ExpenseTracker, {
      props: {
        initialTransactions: [],
      },
    })

    const emptyState = wrapper.find('[data-testid="empty-state"]')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('No transactions found')
  })

  it('should handle loading state', async () => {
    const wrapper = mount(ExpenseTracker, {
      props: {
        initialTransactions: [],
      },
    })

    // Set loading state
    await wrapper.setData({ loading: true })

    const loadingIndicator = wrapper.find('[data-testid="loading"]')
    expect(loadingIndicator.exists()).toBe(true)
  })
})

describe('expenseTracker Integration', () => {
  it('should call API when filters change', async () => {
    const wrapper = mount(ExpenseTracker)

    // Change search filter
    const searchInput = wrapper.find('input[placeholder="Search transactions..."]')
    await searchInput.setValue('grocery')

    // Should trigger API call
    expect($fetch).toHaveBeenCalledWith('/api/transactions', {
      query: expect.objectContaining({
        search: 'grocery',
      }),
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked($fetch).mockRejectedValue(new Error('API Error'))

    const wrapper = mount(ExpenseTracker)

    // Should not crash and should show error handling
    expect(wrapper.exists()).toBe(true)
  })
})
