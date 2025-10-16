<script setup lang="ts">
import { DATE_FORMAT_OPTIONS } from '~/schemas/settings'

// Display preferences
const compactNumbers = ref(false)
const showCurrencyCode = ref(false)
const dateFormat = ref('long')
</script>

<template>
  <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center"
      >
        <UIcon name="i-heroicons-adjustments-horizontal" class="w-5 h-5 text-white" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900">
        Display Preferences
      </h3>
    </div>

    <div class="space-y-6">
      <!-- Number Format -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <label class="flex text-sm font-semibold text-gray-700 mb-3 items-center gap-2">
          <UIcon name="i-heroicons-hashtag" class="w-4 h-4 text-gray-500" />
          Number Format
        </label>
        <div class="space-y-3">
          <UCheckbox
            v-model="compactNumbers"
            label="Use compact format for large numbers (1.5M instead of 1,500,000)"
            class="text-gray-700"
          />
          <UCheckbox
            v-model="showCurrencyCode"
            label="Show currency code alongside symbol (₦ NGN)"
            class="text-gray-700"
          />
        </div>
      </div>

      <!-- Date Format -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <label class="flex text-sm font-semibold text-gray-700 mb-3 items-center gap-2">
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-gray-500" />
          Date Format
        </label>
        <USelectMenu
          v-model="dateFormat"
          :options="DATE_FORMAT_OPTIONS"
          value-attribute="value"
          option-attribute="label"
          class="max-w-md"
        />
      </div>

      <!-- Preview -->
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-eye" class="w-4 h-4 text-gray-500" />
          Preview
        </h4>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-gray-600">Large Amount:</span>
            <CurrencyDisplay
              :amount="1500000"
              :compact="compactNumbers"
              :show-code="showCurrencyCode"
            />
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600">Today's Date:</span>
            <span class="font-medium text-gray-900">{{ new Date().toLocaleDateString('en-NG') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
