<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Budgets - Personal Finance Tracker',
})
</script>

<template>
  <BudgetManager />
</template>
