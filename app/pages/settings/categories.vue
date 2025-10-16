<script setup lang="ts">
import type { CustomCategory } from '~/types'
import { useCustomCategories } from '~/composables/useCustomCategories'
import AddCategoryModal from '~/components/AddCategoryModal.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

// Composables
const { categories, loading, fetchCategories, deleteCategory } = useCustomCategories()
const toast = useToast()

// State
const showAddModal = ref(false)
const selectedType = ref<'income' | 'expense'>('expense')
const searchQuery = ref('')

// Computed
const filteredCategories = computed(() => {
  let filtered = categories.value

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query),
    )
  }

  return filtered
})

const expenseCategories = computed(() =>
  filteredCategories.value.filter(c => c.type === 'expense'),
)

const incomeCategories = computed(() =>
  filteredCategories.value.filter(c => c.type === 'income'),
)

// Methods
async function handleDelete(category: CustomCategory) {
  if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
    return
  }

  const result = await deleteCategory(category.id)

  if (result.success) {
    toast.add({
      title: 'Success',
      description: `Category "${category.name}" deleted successfully`,
      color: 'success',
    })
  }
  else {
    toast.add({
      title: 'Error',
      description: result.error || 'Failed to delete category',
      color: 'error',
    })
  }
}

function handleAdd(type: 'income' | 'expense') {
  selectedType.value = type
  showAddModal.value = true
}

function handleCategorySaved() {
  showAddModal.value = false
  fetchCategories()
}

// Load categories on mount
onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <UIcon name="i-heroicons-squares-plus" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Custom Categories
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage your personalized transaction categories
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <UCard>
      <UInput
        v-model="searchQuery"
        placeholder="Search categories..."
        icon="i-heroicons-magnifying-glass"
        size="lg"
      />
    </UCard>

    <!-- Expense Categories -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5 text-red-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Expense Categories
            </h2>
            <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
              {{ expenseCategories.length }}
            </span>
          </div>
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-plus"
            @click="handleAdd('expense')"
          >
            Add Expense Category
          </UButton>
        </div>
      </template>

      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-400 animate-spin" />
      </div>

      <div v-else-if="expenseCategories.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-folder-open" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">No expense categories yet</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first custom category</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="category in expenseCategories"
          :key="category.id"
          class="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
        >
          <div class="flex items-center gap-3 flex-1">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              :style="{ backgroundColor: category.color + '20', color: category.color }"
            >
              {{ category.icon || '📁' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ category.name }}
              </p>
              <p v-if="category.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ category.description }}
              </p>
            </div>
          </div>
          <UButton
            color="error"
            variant="ghost"
            size="xs"
            icon="i-heroicons-trash"
            @click="handleDelete(category)"
          />
        </div>
      </div>
    </UCard>

    <!-- Income Categories -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5 text-green-500" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Income Categories
            </h2>
            <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
              {{ incomeCategories.length }}
            </span>
          </div>
          <UButton
            color="success"
            size="sm"
            icon="i-heroicons-plus"
            @click="handleAdd('income')"
          >
            Add Income Category
          </UButton>
        </div>
      </template>

      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-400 animate-spin" />
      </div>

      <div v-else-if="incomeCategories.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-folder-open" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">No income categories yet</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first custom category</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="category in incomeCategories"
          :key="category.id"
          class="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <div class="flex items-center gap-3 flex-1">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              :style="{ backgroundColor: category.color + '20', color: category.color }"
            >
              {{ category.icon || '📁' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ category.name }}
              </p>
              <p v-if="category.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ category.description }}
              </p>
            </div>
          </div>
          <UButton
            color="error"
            variant="ghost"
            size="xs"
            icon="i-heroicons-trash"
            @click="handleDelete(category)"
          />
        </div>
      </div>
    </UCard>

    <!-- Add Category Modal -->
    <AddCategoryModal
      v-if="showAddModal"
      :type="selectedType"
      @close="showAddModal = false"
      @saved="handleCategorySaved"
    />
  </div>
</template>
