<script setup lang="ts">
const { expenseCategories } = useCurrency()
</script>

<template>
  <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
    <div class="flex items-center gap-3 mb-4">
      <div
        class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center"
      >
        <UIcon name="i-heroicons-tag" class="w-5 h-5 text-white" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900">
        Nigerian Expense Categories
      </h3>
    </div>

    <div class="space-y-4">
      <p class="text-gray-600">
        Pre-configured expense categories tailored for Nigerian users, including local context and common
        spending patterns.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="category in expenseCategories"
          :key="category.id"
          class="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{{ category.icon }}</span>
            <span class="font-semibold text-gray-900">{{ category.name }}</span>
          </div>
          <div class="text-xs text-gray-600 space-y-1">
            <div
              v-for="sub in category.subcategories.slice(0, 3)"
              :key="sub"
              class="flex items-center gap-1"
            >
              <UIcon name="i-heroicons-chevron-right" class="w-3 h-3 text-gray-400" />
              {{ sub }}
            </div>
            <div v-if="category.subcategories.length > 3" class="text-gray-400 font-medium">
              +{{ category.subcategories.length - 3 }} more categories
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
