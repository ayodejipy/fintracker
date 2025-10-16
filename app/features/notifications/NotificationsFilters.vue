<script setup lang="ts">
import type { NotificationType } from '~/schemas/notifications'
import { NOTIFICATION_TYPE_OPTIONS } from '~/schemas/notifications'

interface Props {
  selectedType: NotificationType | 'all'
  showUnreadOnly: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedType': [type: NotificationType | 'all']
  'update:showUnreadOnly': [value: boolean]
}>()

const localSelectedType = computed({
  get: () => props.selectedType,
  set: value => emit('update:selectedType', value),
})

const localShowUnreadOnly = computed({
  get: () => props.showUnreadOnly,
  set: value => emit('update:showUnreadOnly', value),
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex flex-col sm:flex-row gap-6">
      <div class="flex-1">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Filter by type
        </label>
        <USelectMenu
          v-model="localSelectedType"
          :options="NOTIFICATION_TYPE_OPTIONS"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </div>

      <div class="flex-1">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Show only
        </label>
        <div class="flex items-center space-x-4 pt-2">
          <UCheckbox
            v-model="localShowUnreadOnly"
            label="Unread notifications only"
            class="text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
    </div>
  </div>
</template>
