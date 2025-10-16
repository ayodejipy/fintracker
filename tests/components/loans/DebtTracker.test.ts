import type { Loan } from '~/types'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import DebtTracker from '~/features/loans/components/DebtTracker.vue'

// Mock the composables
const mockLoans = ref<Loan[]>([])
const mockLoading = ref(false)
const mockError = ref<string | null>(null)
const mockFetchLoans = vi.fn()
const mockDeleteLoan = vi.fn()
const mockRecordPayment = vi.fn()

vi.mock('~/features/loans/composables/useLoans', () => ({
  useLoans: () => ({
    loans: mockLoans,
    loading: mockLoading,
    error: mockError,
    fetchLoans: mockFetchLoans,
    deleteLoan: mockDeleteLoan,
    recordPayment: mockRecordPayment,
    totalDebt: computed(() => mockLoans.value.reduce((total, loan) => total + loan.currentBalance, 0)),
    totalMonthlyPayments: computed(() => mockLoans.value.reduce((total, loan) => total + loan.monthlyPayment, 0)),
    activeLoans: computed(() => mockLoans.value.filter(loan => loan.currentBalance > 0)),
    paidOffLoans: computed(() => mockLoans.value.filter(loan => loan.currentBalance <= 0)),
  }),
}))

// Mock child components
vi.mock('~/features/loans/components/LoanItem.vue', () => ({
  default: {
    name: 'LoanItem',
    template: '<div data-testid="loan-item">{{ loan.name }}</div>',
    props: ['loan', 'isPaidOff'],
    emits: ['recordPayment', 'edit', 'delete', 'viewProjection'],
  },
}))

vi.mock('~/features/loans/components/LoanForm.vue', () => ({
  default: {
    name: 'LoanForm',
    template: '<div data-testid="loan-form">Loan Form</div>',
    props: ['loan'],
    emits: ['close', 'success'],
  },
}))

vi.mock('~/features/loans/components/PaymentModal.vue', () => ({
  default: {
    name: 'PaymentModal',
    template: '<div data-testid="payment-modal">Payment Modal</div>',
    props: ['loan'],
    emits: ['close', 'success'],
  },
}))

vi.mock('~/features/loans/components/LoanProjectionModal.vue', () => ({
  default: {
    name: 'LoanProjectionModal',
    template: '<div data-testid="projection-modal">Projection Modal</div>',
    props: ['loan'],
    emits: ['close'],
  },
}))

// Mock currency utility
vi.mock('~/utils/currency', () => ({
  formatCurrency: (amount: number) => `₦${amount.toLocaleString()}`,
}))

describe('debtTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoans.value = []
    mockLoading.value = false
    mockError.value = null
  })

  it('renders correctly with empty state', () => {
    const wrapper = mount(DebtTracker)

    expect(wrapper.find('h2').text()).toBe('Debt Overview')
    expect(wrapper.text()).toContain('No loans yet')
    expect(wrapper.text()).toContain('Start tracking your loans')
  })

  it('displays loan summary correctly', async () => {
    const mockLoanData: Loan[] = [
      {
        id: '1',
        userId: 'user1',
        name: 'Car Loan',
        initialAmount: 1000000,
        currentBalance: 800000,
        monthlyPayment: 50000,
        interestRate: 12,
        startDate: new Date('2024-01-01'),
        projectedPayoffDate: new Date('2025-12-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'user1',
        name: 'Personal Loan',
        initialAmount: 500000,
        currentBalance: 200000,
        monthlyPayment: 25000,
        interestRate: 15,
        startDate: new Date('2024-02-01'),
        projectedPayoffDate: new Date('2025-06-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockLoans.value = mockLoanData

    const wrapper = mount(DebtTracker)

    // Check summary cards
    expect(wrapper.text()).toContain('₦1,000,000') // Total debt
    expect(wrapper.text()).toContain('₦75,000') // Total monthly payments
    expect(wrapper.text()).toContain('2') // Active loans count
  })

  it('shows loading state', () => {
    mockLoading.value = true

    const wrapper = mount(DebtTracker)

    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('shows error state', () => {
    mockError.value = 'Failed to load loans'

    const wrapper = mount(DebtTracker)

    expect(wrapper.text()).toContain('Failed to load loans')
    expect(wrapper.find('button').text()).toContain('Try again')
  })

  it('calls fetchLoans on mount', () => {
    mount(DebtTracker)

    expect(mockFetchLoans).toHaveBeenCalledOnce()
  })

  it('opens add loan form when button is clicked', async () => {
    const wrapper = mount(DebtTracker)

    await wrapper.find('button').trigger('click')

    expect(wrapper.findComponent({ name: 'LoanForm' }).exists()).toBe(true)
  })

  it('separates active and paid off loans', () => {
    const mockLoanData: Loan[] = [
      {
        id: '1',
        userId: 'user1',
        name: 'Active Loan',
        initialAmount: 1000000,
        currentBalance: 500000,
        monthlyPayment: 50000,
        interestRate: 12,
        startDate: new Date('2024-01-01'),
        projectedPayoffDate: new Date('2025-12-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'user1',
        name: 'Paid Off Loan',
        initialAmount: 500000,
        currentBalance: 0,
        monthlyPayment: 25000,
        interestRate: 15,
        startDate: new Date('2024-02-01'),
        projectedPayoffDate: new Date('2025-06-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockLoans.value = mockLoanData

    const wrapper = mount(DebtTracker)

    expect(wrapper.text()).toContain('Active Loans')
    expect(wrapper.text()).toContain('Paid Off Loans')
  })

  it('handles loan deletion with confirmation', async () => {
    const mockLoanData: Loan[] = [
      {
        id: '1',
        userId: 'user1',
        name: 'Test Loan',
        initialAmount: 1000000,
        currentBalance: 500000,
        monthlyPayment: 50000,
        interestRate: 12,
        startDate: new Date('2024-01-01'),
        projectedPayoffDate: new Date('2025-12-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockLoans.value = mockLoanData

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = mount(DebtTracker)
    const loanItem = wrapper.findComponent({ name: 'LoanItem' })

    await loanItem.vm.$emit('delete', mockLoanData[0])

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Test Loan"?')
    expect(mockDeleteLoan).toHaveBeenCalledWith('1')

    confirmSpy.mockRestore()
  })
})
