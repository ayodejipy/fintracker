import type { Transaction } from '~/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TransactionItem from '~/app/features/transactions/components/TransactionItem.vue'

// Mock utilities
vi.mock('~/utils/categories', () => ({
  getCategoryDisplayName: vi.fn((category: string) => `${category} Display Name`),
  getCategoryColor: vi.fn(() => '#3b82f6'),
}))

vi.mock('~/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number) => `₦${amount.toLocaleString()}`),
}))

vi.mock('~/utils/date', () => ({
  formatDate: vi.fn((date: Date) => date.toLocaleDateString()),
  formatTime: vi.fn((date: Date) => date.toLocaleTimeString()),
}))

describe('transactionItem', () => {
  const mockTransaction: Transaction = {
    id: '1',
    userId: 'user1',
    amount: 50000,
    category: 'food',
    description: 'Grocery shopping at Shoprite',
    date: new Date('2024-01-15T10:30:00'),
    type: 'expense',
    createdAt: new Date('2024-01-15T10:30:00'),
  }

  it('should render transaction details correctly', () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: mockTransaction,
      },
    })

    // Should display description
    expect(wrapper.text()).toContain('Grocery shopping at Shoprite')

    // Should display category
    expect(wrapper.text()).toContain('food Display Name')

    // Should display type badge
    expect(wrapper.text()).toContain('expense')
  })

  it('should display income transactions with positive styling', () => {
    const incomeTransaction: Transaction = {
      ...mockTransaction,
      type: 'income',
      amount: 500000,
      description: 'Monthly salary',
    }

    const wrapper = mount(TransactionItem, {
      props: {
        transaction: incomeTransaction,
      },
    })

    // Should show positive amount with + sign
    const amountElement = wrapper.find('[data-testid="transaction-amount"]')
    expect(amountElement.text()).toContain('+₦500,000')
    expect(amountElement.classes()).toContain('text-green-600')
  })

  it('should display expense transactions with negative styling', () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: mockTransaction,
      },
    })

    // Should show negative amount with - sign
    const amountElement = wrapper.find('[data-testid="transaction-amount"]')
    expect(amountElement.text()).toContain('-₦50,000')
    expect(amountElement.classes()).toContain('text-red-600')
  })

  it('should emit edit event when edit action is clicked', async () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: mockTransaction,
      },
    })

    // Find and click edit button
    const editButton = wrapper.find('[data-testid="edit-button"]')
    await editButton.trigger('click')

    // Should emit edit event with transaction
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockTransaction])
  })

  it('should emit delete event when delete action is clicked', async () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: mockTransaction,
      },
    })

    // Find and click delete button
    const deleteButton = wrapper.find('[data-testid="delete-button"]')
    await deleteButton.trigger('click')

    // Should emit delete event with transaction
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockTransaction])
  })

  it('should display correct category icon', () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: mockTransaction,
      },
    })

    // Should have category icon
    const categoryIcon = wrapper.find('[data-testid="category-icon"]')
    expect(categoryIcon.exists()).toBe(true)
  })

  it('should truncate long descriptions', () => {
    const longDescriptionTransaction: Transaction = {
      ...mockTransaction,
      description: 'This is a very long transaction description that should be truncated when displayed in the transaction item component',
    }

    const wrapper = mount(TransactionItem, {
      props: {
        transaction: longDescriptionTransaction,
      },
    })

    const descriptionElement = wrapper.find('[data-testid="transaction-description"]')
    expect(descriptionElement.classes()).toContain('truncate')
  })

  it('should display formatted date and time', () => {
    const wrapper = mount(TransactionItem, {
      props: {
        transaction: mockTransaction,
      },
    })

    // Should display formatted date
    expect(wrapper.text()).toContain(mockTransaction.date.toLocaleDateString())

    // Should display formatted time
    expect(wrapper.text()).toContain(mockTransaction.date.toLocaleTimeString())
  })
})
