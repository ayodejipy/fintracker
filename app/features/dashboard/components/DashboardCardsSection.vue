<script setup lang="ts">
import { formatCurrency } from '~/utils/currency'

const cards = [
  {
    id: 1,
    type: 'Master Card',
    balance: 28572.00,
    currency: 'Euro',
    status: 'Active',
    lastDigits: '2870',
    color: 'bg-gradient-to-r from-orange-400 to-red-500',
  },
  {
    id: 2,
    type: 'Credit Card',
    balance: 12148.00,
    currency: 'US Dollar',
    status: 'Disabled',
    lastDigits: '2870',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
  },
  {
    id: 3,
    type: 'Business Card',
    balance: 58629.00,
    currency: 'Canada Dollar',
    status: 'Disabled',
    lastDigits: '2870',
    color: 'bg-gradient-to-r from-gray-800 to-gray-900',
  },
]
</script>

<template>
  <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">
        My Cards
      </h3>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        Add New Card
      </button>
    </div>

    <div class="space-y-4">
      <div v-for="card in cards" :key="card.id" class="relative">
        <!-- Card Display -->
        <div class="w-full h-24 rounded-xl p-4 text-white relative overflow-hidden" :class="card.color">
          <!-- Card Background Pattern -->
          <div class="absolute inset-0 opacity-10">
            <svg class="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="20" cy="20" r="15" fill="currentColor" />
              <circle cx="80" cy="80" r="20" fill="currentColor" />
            </svg>
          </div>

          <div class="relative z-10 flex items-center justify-between h-full">
            <div class="flex-1">
              <div class="text-lg font-bold">
                {{ formatCurrency(card.balance) }}
              </div>
              <div class="text-xs opacity-90">
                {{ card.currency }}
              </div>
            </div>

            <div class="text-right">
              <div class="text-xs opacity-75 mb-1">
                {{ card.type }}
              </div>
              <div class="text-sm font-mono">
                •••• •••• •••• {{ card.lastDigits }}
              </div>
            </div>
          </div>
        </div>

        <!-- Card Status -->
        <div class="flex items-center justify-between mt-2 px-1">
          <span class="text-sm font-medium text-gray-700">{{ card.type }}</span>
          <span
            class="text-xs px-2 py-1 rounded-full" :class="{
              'bg-green-100 text-green-700': card.status === 'Active',
              'bg-red-100 text-red-700': card.status === 'Disabled',
            }"
          >
            {{ card.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
