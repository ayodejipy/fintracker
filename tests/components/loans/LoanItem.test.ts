import type { Loan } from '~/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import LoanItem from '~/features/loans/components/LoanItem.vue'

// Mock currency utility
vi.mock('~/utils/currency', () => ({
  formatCurrency: (amount: number) => `₦${amount.toLocaleString()}`,
  formatDate: (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
  },
}))

describe('loanItem', () => {
  const mockLoan: Loan = {
    id: '1',
    userId: 'user1',
    name: 'Car Loan',
    initialAmount: 1000000,
    currentBalance: 600000,
    monthlyPayment: 50000,
    interestRate: 12,
    startDate: new Date('2024-01-01'),
    projectedPayoffDate: new Date('2025-12-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('renders loan information correctly', () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    expect(wrapper.text()).toContain('Car Loan')
    expect(wrapper.text()).toContain('₦600,000') // Current balance
    expect(wrapper.text()).toContain('₦1,000,000') // Initial amount
    expect(wrapper.text()).toContain('₦50,000') // Monthly payment
    expect(wrapper.text()).toContain('12%') // Interest rate
    expect(wrapper.text()).toContain('Active')
  })

  it('shows paid off status for completed loans', () => {
    const paidOffLoan = { ...mockLoan, currentBalance: 0 }

    const wrapper = mount(LoanItem, {
      props: {
        loan: paidOffLoan,
        isPaidOff: true,
      },
    })

    expect(wrapper.text()).toContain('Paid Off')
    expect(wrapper.find('.text-green-600').exists()).toBe(true)
  })

  it('calculates progress percentage correctly', () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    // Progress should be (1000000 - 600000) / 1000000 * 100 = 40%
    expect(wrapper.text()).toContain('40% paid')

    const progressBar = wrapper.find('.bg-green-500')
    expect(progressBar.attributes('style')).toContain('width: 40%')
  })

  it('calculates months remaining correctly', () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    // Months remaining should be 600000 / 50000 = 12 months
    expect(wrapper.text()).toContain('12 months remaining')
  })

  it('emits record payment event', async () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    const recordPaymentButton = wrapper.find('button[title="Record Payment"]')
    await recordPaymentButton.trigger('click')

    expect(wrapper.emitted('recordPayment')).toBeTruthy()
    expect(wrapper.emitted('recordPayment')?.[0]).toEqual([mockLoan])
  })

  it('emits view projection event', async () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    const projectionButton = wrapper.find('button[title="View Projection"]')
    await projectionButton.trigger('click')

    expect(wrapper.emitted('viewProjection')).toBeTruthy()
    expect(wrapper.emitted('viewProjection')?.[0]).toEqual([mockLoan])
  })

  it('emits edit event', async () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    const editButton = wrapper.find('button[title="Edit Loan"]')
    await editButton.trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockLoan])
  })

  it('emits delete event', async () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    const deleteButton = wrapper.find('button[title="Delete Loan"]')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockLoan])
  })

  it('hides action buttons for paid off loans except delete', () => {
    const paidOffLoan = { ...mockLoan, currentBalance: 0 }

    const wrapper = mount(LoanItem, {
      props: {
        loan: paidOffLoan,
        isPaidOff: true,
      },
    })

    expect(wrapper.find('button[title="Record Payment"]').exists()).toBe(false)
    expect(wrapper.find('button[title="View Projection"]').exists()).toBe(false)
    expect(wrapper.find('button[title="Edit Loan"]').exists()).toBe(false)
    expect(wrapper.find('button[title="Delete Loan"]').exists()).toBe(true)
  })

  it('handles zero initial amount gracefully', () => {
    const zeroLoan = { ...mockLoan, initialAmount: 0 }

    const wrapper = mount(LoanItem, {
      props: { loan: zeroLoan },
    })

    expect(wrapper.text()).toContain('0% paid')
  })

  it('handles zero monthly payment gracefully', () => {
    const zeroPaymentLoan = { ...mockLoan, monthlyPayment: 0 }

    const wrapper = mount(LoanItem, {
      props: { loan: zeroPaymentLoan },
    })

    expect(wrapper.text()).not.toContain('months remaining')
  })

  it('shows projected payoff date when available', () => {
    const wrapper = mount(LoanItem, {
      props: { loan: mockLoan },
    })

    expect(wrapper.text()).toContain('Projected payoff')
  })

  it('handles missing projected payoff date', () => {
    const loanWithoutPayoff = { ...mockLoan, projectedPayoffDate: null }

    const wrapper = mount(LoanItem, {
      props: { loan: loanWithoutPayoff },
    })

    expect(wrapper.text()).not.toContain('Projected payoff')
  })
})
