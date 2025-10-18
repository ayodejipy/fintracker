<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Transactions - Personal Finance Tracker',
})
</script>

<template>
  <ExpenseTracker />
</template>
