<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Loans - Personal Finance Tracker',
})
</script>

<template>
  <DebtTracker />
</template>
