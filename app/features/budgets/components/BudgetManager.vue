<script setup lang="ts">
import type { Budget, BudgetAnalysisResponse } from '~/types'
import { useCustomCategories } from '~/composables/useCustomCategories'
import { useBudgets } from '../composables/useBudgets'
import BudgetForm from './BudgetForm.vue'

// Props
interface Props {
  initialBudgets?: Budget[]
  currentMonth?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialBudgets: () => [],
  currentMonth: () => new Date().toISOString().slice(0, 7),
})

// Composables
const {
  loading,
  fetchBudgets,
  fetchAnalysis,
  syncBudgets,
  calculateMetrics,
  deleteBudget,
} = useBudgets()

const { fetchCategories, getCategoryOptions } = useCustomCategories()

// Reactive state
const budgets = ref<Budget[]>(props.initialBudgets)
const analysis = ref<BudgetAnalysisResponse['data'] | null>(null)
const selectedMonth = ref(props.currentMonth)

// Computed
const metrics = computed(() => calculateMetrics(budgets.value))

const availableCategories = computed(() => {
  const usedCategories = new Set(budgets.value.map(b => b.category))
  const expenseOptions = getCategoryOptions('expense')
  return expenseOptions.filter(option => !usedCategories.has(option.value as any))
})

// Methods
async function refreshData() {
  const [budgetData, analysisData] = await Promise.all([
    fetchBudgets({ month: selectedMonth.value }),
    fetchAnalysis(selectedMonth.value),
  ])

  if (budgetData) { budgets.value = budgetData }
  if (analysisData) { analysis.value = analysisData }
}

async function loadCategories() {
  await fetchCategories()
}

async function handleSync() {
  const success = await syncBudgets(selectedMonth.value)
  if (success) {
    await refreshData()
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Budgets synchronized with transactions',
      color: 'success',
    })
  }
}

function handleEdit(budget: Budget) {
  const { open } = useModal()

  open({
    component: BudgetForm,
    props: {
      budget,
      month: selectedMonth.value,
      availableCategories: availableCategories.value,
    },
    onConfirm: async () => {
      await refreshData()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'Budget updated successfully',
        color: 'success',
      })
    },
  })
}

async function handleDelete(budget: Budget) {
  const confirmed = await openConfirmation({
    title: 'Delete Budget?',
    message: `Are you sure you want to delete the ${budget.category} budget? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
    icon: 'i-heroicons-trash',
  })

  if (!confirmed) { return }

  try {
    const success = await deleteBudget(budget.id)
    if (success) {
      await refreshData()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'Budget deleted successfully',
        color: 'success',
      })
    }
  }
  catch (error) {
    console.error('Error deleting budget:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to delete budget',
      color: 'error',
    })
  }
}

function handleAddBudget() {
  const { open } = useModal()

  open({
    component: BudgetForm,
    props: {
      budget: null,
      month: selectedMonth.value,
      availableCategories: availableCategories.value,
    },
    onConfirm: async () => {
      await refreshData()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'Budget created successfully',
        color: 'success',
      })
    },
  })
}

// Watchers
watch(selectedMonth, refreshData)

// Initialize
onMounted(async () => {
  await loadCategories()
  await refreshData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Budget Manager
        </h2>
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500">
          Track and manage your monthly budgets
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <UButton
          variant="ghost"
          size="sm"
          :loading="loading"
          icon="i-heroicons-arrow-path"
          @click="handleSync"
        >
          Sync
        </UButton>
        <UButton
          icon="i-heroicons-plus"
          size="lg"
          :disabled="availableCategories.length === 0"
          @click="handleAddBudget"
        >
          Add Budget
        </UButton>
      </div>
    </div>

    <!-- Month Selector -->
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">
            Budget Period
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Select month to view budgets
          </p>
        </div>
        <UInput
          v-model="selectedMonth"
          type="month"
          class="w-48"
        />
      </div>
    </UCard>

    <!-- Budget Overview -->
    <BudgetOverview
      :total-budget="metrics.totalBudget"
      :total-spent="metrics.totalSpent"
      :total-remaining="metrics.totalRemaining"
      :utilization-rate="metrics.utilizationRate"
    />

    <!-- Alerts -->
    <BudgetAlerts :alerts="analysis?.alerts || []" />

    <!-- Budget List -->
    <BudgetList
      :budgets="budgets"
      :loading="loading"
      @edit="handleEdit"
      @delete="handleDelete"
      @add-new="handleAddBudget"
    />

    <!-- Recommendations -->
    <BudgetRecommendations :recommendations="analysis?.recommendations || []" />
  </div>
</template>
