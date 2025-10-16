<script setup lang="ts">
import RecurringExpenseManager from '~/features/recurring-expenses/components/RecurringExpenseManager.vue'

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})
</script>

<template>
  <RecurringExpenseManager />
</template>