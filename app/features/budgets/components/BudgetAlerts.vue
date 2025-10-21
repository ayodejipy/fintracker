<script setup lang="ts">
import type { BudgetAnalysisResponse } from '~/types'

// Props
interface Props {
  alerts: BudgetAnalysisResponse['data']['alerts']
}

defineProps<Props>()

// Get icon for alert type
function getAlertIcon(type: string) {
  return type === 'danger' ? 'i-heroicons-exclamation-circle' : 'i-heroicons-exclamation-triangle'
}

// Get title for alert type
function getAlertTitle(type: string) {
  return type === 'danger' ? 'Budget Exceeded' : 'Budget Warning'
}
</script>

<template>
  <div v-if="alerts && alerts.length > 0" class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Budget Alerts
      </h3>
      <UBadge color="error" variant="subtle" size="sm">
        {{ alerts.length }} {{ alerts.length === 1 ? 'Alert' : 'Alerts' }}
      </UBadge>
    </div>
    <div class="space-y-3">
      <UAlert
        v-for="alert in alerts"
        :key="`${alert.category}-${alert.type}`"
        :color="alert.type === 'danger' ? 'error' : 'warning'"
        :icon="getAlertIcon(alert.type)"
        :title="getAlertTitle(alert.type)"
        :description="alert.message"
        variant="soft"
      />
    </div>
  </div>
</template>
