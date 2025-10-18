<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Savings - Personal Finance Tracker',
})
</script>

<template>
  <SavingsProjection />
</template>
