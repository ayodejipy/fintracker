<script setup lang="ts">
// Require authentication
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

// Set page title
useHead({
  title: 'Performance Dashboard - Personal Finance Tracker',
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <PerformanceDashboard />
    </div>
  </div>
</template>
