<script setup lang="ts">
import RecurringExpenseManager from '~/features/recurring-expenses/components/RecurringExpenseManager.vue'

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Recurring Expenses - Personal Finance Tracker',
})
</script>

<template>
  <RecurringExpenseManager />
</template>
