<script setup lang="ts">
// Landing page for the personal finance dashboard
definePageMeta({
  layout: false,
})

// Set page title
useHead({
  title: 'Personal Finance Tracker - Manage Your Money Better',
})

const { isAuthenticated } = useAuth()

// Redirect authenticated users to dashboard
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    navigateTo('/dashboard')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-16">
      <!-- Header -->
      <div class="text-center mb-16">
        <div class="flex justify-center items-center mb-6">
          <UIcon name="i-heroicons-banknotes" class="h-16 w-16 text-blue-600 dark:text-blue-400 mr-4" />
          <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Personal Finance Dashboard
          </h1>
        </div>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Take control of your finances with our comprehensive dashboard designed for Nigerian users.
          Track expenses, manage loans, set savings goals, and build a better financial future.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <UCard>
          <UIcon name="i-heroicons-chart-bar" class="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Expense Tracking
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Track your daily expenses with Nigerian-specific categories like transport, data/airtime, and home allowance.
          </p>
        </UCard>

        <UCard>
          <UIcon name="i-heroicons-credit-card" class="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Loan Management
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Monitor your loans, track payments, and see projected payoff dates with detailed amortization schedules.
          </p>
        </UCard>

        <UCard>
          <UIcon name="i-heroicons-currency-dollar" class="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Budget Planning
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Set monthly budgets by category and get alerts when you're approaching your limits.
          </p>
        </UCard>

        <UCard>
          <UIcon name="i-heroicons-trophy" class="h-12 w-12 text-yellow-600 dark:text-yellow-400 mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Savings Goals
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Set and track savings goals with projections and milestone celebrations to keep you motivated.
          </p>
        </UCard>
      </div>

      <!-- CTA Section -->
      <div class="text-center">
        <UCard class="max-w-2xl mx-auto">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to take control of your finances?
          </h2>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Join thousands of Nigerians who are already managing their money better with our dashboard.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              to="/auth/register"
              color="primary"
              size="lg"
              icon="i-heroicons-rocket-launch"
            >
              Get Started Free
            </UButton>
            <UButton
              to="/auth/login"
              variant="outline"
              size="lg"
              icon="i-heroicons-arrow-right-on-rectangle"
            >
              Sign In
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Footer -->
      <div class="text-center mt-16 text-gray-500 dark:text-gray-400">
        <p>&copy; 2024 Personal Finance Dashboard. Built for Nigerian users.</p>
      </div>
    </div>
  </div>
</template>
