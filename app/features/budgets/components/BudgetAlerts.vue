<script setup lang="ts">
import type { BudgetAnalysisResponse } from '~/types'

// Props
interface Props {
  alerts: BudgetAnalysisResponse['data']['alerts']
}

defineProps<Props>()
</script>

<template>
  <div v-if="alerts && alerts.length > 0" class="space-y-3">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
      Budget Alerts
    </h3>
    <div class="space-y-2">
      <UAlert
        v-for="alert in alerts" :key="`${alert.category}-${alert.type}`"
        :color="alert.type === 'danger' ? 'error' : 'warning'"
        :title="alert.type === 'danger' ? 'Budget Exceeded' : 'Budget Warning'" :description="alert.message"
        variant="soft"
      />
    </div>
  </div>
</template>
