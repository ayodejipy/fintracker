<script setup lang="ts">
import type { NotificationType } from '~/schemas/notifications'
import { NOTIFICATION_STATS } from '~/schemas/notifications'

interface Props {
  notificationsByType: Record<NotificationType, any[]>
}

const props = defineProps<Props>()

const statsData = computed(() => {
  return NOTIFICATION_STATS.map((stat) => {
    let count = 0

    if (stat.key === 'achievements') {
      // Special case for achievements - combine goal_achieved and goal_milestone
      count = (props.notificationsByType.goal_achieved?.length || 0)
        + (props.notificationsByType.goal_milestone?.length || 0)
    }
    else {
      count = props.notificationsByType[stat.key as NotificationType]?.length || 0
    }

    return {
      ...stat,
      count,
    }
  })
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div
      v-for="stat in statsData"
      :key="stat.key"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br" :class="[
              stat.gradient,
            ]"
          >
            <UIcon :name="stat.icon" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {{ stat.title }}
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ stat.count }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
