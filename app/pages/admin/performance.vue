<script setup lang="ts">
import PerformanceDashboard from '~/components/admin/PerformanceDashboard.vue'

// Set page meta
definePageMeta({
  title: 'Performance Dashboard',
  requiresAuth: true,
  layout: 'dashboard',
})

// SEO
useSeoMeta({
  title: 'Performance Dashboard - Personal Finance Tracker',
  description: 'Monitor application performance and system health metrics',
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Performance Dashboard
        </h1>
        <p class="mt-2 text-gray-600">
          Monitor application performance and system health
        </p>
      </div>

      <!-- Performance Dashboard Component -->
      <PerformanceDashboard />
    </div>
  </div>
</template>
