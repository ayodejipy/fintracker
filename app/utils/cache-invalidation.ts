/**
 * Cache invalidation utilities for managing useFetch cache
 */

/**
 * Invalidate all dashboard-related caches
 */
export async function invalidateDashboardCache() {
  await clearNuxtData(/^dashboard-overview/)
}

/**
 * Invalidate all transaction-related caches
 */
export async function invalidateTransactionCache() {
  await clearNuxtData(/^transactions-list/)
}

/**
 * Invalidate all budget-related caches
 */
export async function invalidateBudgetCache() {
  await clearNuxtData(/^budgets-list/)
}

/**
 * Invalidate all loan-related caches
 */
export async function invalidateLoanCache() {
  await clearNuxtData(/^loans-list/)
}

/**
 * Invalidate all savings goal-related caches
 */
export async function invalidateSavingsCache() {
  await clearNuxtData(/^savings-goals-list/)
}

/**
 * Invalidate all financial data caches (after major changes)
 */
export async function invalidateAllFinancialCache() {
  await Promise.all([
    invalidateDashboardCache(),
    invalidateTransactionCache(),
    invalidateBudgetCache(),
    invalidateLoanCache(),
    invalidateSavingsCache(),
  ])
}

/**
 * Invalidate caches after transaction changes
 */
export async function invalidateAfterTransactionChange() {
  await Promise.all([
    invalidateDashboardCache(), // Dashboard shows transaction summaries
    invalidateTransactionCache(),
    invalidateBudgetCache(), // Budgets track spending
  ])
}

/**
 * Invalidate caches after budget changes
 */
export async function invalidateAfterBudgetChange() {
  await Promise.all([
    invalidateDashboardCache(), // Dashboard shows budget summaries
    invalidateBudgetCache(),
  ])
}

/**
 * Invalidate caches after loan changes
 */
export async function invalidateAfterLoanChange() {
  await Promise.all([
    invalidateDashboardCache(), // Dashboard shows debt summaries
    invalidateLoanCache(),
  ])
}

/**
 * Invalidate caches after savings goal changes
 */
export async function invalidateAfterSavingsChange() {
  await Promise.all([
    invalidateDashboardCache(), // Dashboard shows savings summaries
    invalidateSavingsCache(),
  ])
}
