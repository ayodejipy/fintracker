<script setup lang="ts">
// Import feature components and composables
import StatementSummary from '~/features/import/components/StatementSummary.vue'
import StatementUploadCard from '~/features/import/components/StatementUploadCard.vue'
import TransactionReviewTable from '~/features/import/components/TransactionReviewTable.vue'
import UploadProgress from '~/features/import/components/UploadProgress.vue'
import { useStatementImport } from '~/features/import/composables/useStatementImport'
import { useStatementReview } from '~/features/import/composables/useStatementReview'
import { useStatementUpload } from '~/features/import/composables/useStatementUpload'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

useHead({
  title: 'Import Bank Statement - Personal Finance Tracker',
})

// Composables
const { fetchCategories, getCategoryOptions } = useCustomCategories()
const uploadComposable = useStatementUpload()
const reviewComposable = useStatementReview()
const importComposable = useStatementImport()

// Destructure composable state/methods
const { uploading, uploadStatus, uploadProgress, error, passwordRequired } = uploadComposable
const { parseResult, reviewTransactions, canImport } = reviewComposable
const { importing } = importComposable

// Fetch categories on mount
onMounted(async () => {
  await fetchCategories() // Fetch all categories (system + custom)
})

// Get category options for dropdowns (combine income and expense)
const categoryOptions = computed(() => {
  const expense = getCategoryOptions('expense')
  const income = getCategoryOptions('income')
  const fee = getCategoryOptions('fee')
  return [...expense, ...income, ...fee]
})

// Handle file change
function handleFileChange() {
  uploadComposable.resetUploadState()
}

// Handle upload
async function handleUpload(file: File, password?: string) {
  const result = await uploadComposable.uploadStatement(file, password)

  if (result.success && result.data) {
    reviewComposable.initializeReview(result.data)
  }
}

// Handle transaction removal
function handleTransactionRemove(index: number) {
  reviewComposable.removeTransaction(index)
}

// Handle category update
function handleCategoryUpdate(index: number, category: string) {
  reviewComposable.updateTransactionCategory(index, category)
}

// Handle description update
function handleDescriptionUpdate(index: number, description: string) {
  reviewComposable.updateTransactionDescription(index, description)
}

// Import confirmed transactions
async function confirmImport() {
  if (!parseResult.value || !canImport.value) {
    return
  }

  const result = await importComposable.importTransactions(
    reviewTransactions.value,
    parseResult.value.bankName,
  )

  if (result.success) {
    // Show success message and redirect to transactions page
    navigateTo('/transactions?imported=true')
  }
}

// Reset and upload new file
function resetUpload() {
  reviewComposable.resetReview()
  uploadComposable.resetUploadState()
}
</script>

<template>
  <div class="container mx-auto py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Import Bank Statement
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Upload your bank statement PDF to automatically import transactions
        </p>
      </div>

      <!-- Upload Section -->
      <StatementUploadCard
        v-if="!parseResult"
        :uploading="uploading"
        :error="error"
        :password-required="passwordRequired"
        @upload="handleUpload"
        @file-change="handleFileChange"
      >
        <template #progress>
          <UploadProgress
            :upload-status="uploadStatus"
            :upload-progress="uploadProgress"
          />
        </template>
      </StatementUploadCard>

      <!-- Review Section -->
      <div v-else class="space-y-6">
        <!-- Summary -->
        <StatementSummary :parse-result="parseResult" />

        <!-- Transactions Table -->
        <TransactionReviewTable
          :transactions="reviewTransactions"
          :category-options="categoryOptions"
          @remove="handleTransactionRemove"
          @update-category="handleCategoryUpdate"
          @update-description="handleDescriptionUpdate"
        />

        <!-- Action Buttons -->
        <div class="flex justify-between items-center">
          <UButton
            color="neutral"
            variant="ghost"
            @click="resetUpload"
          >
            Cancel & Upload New Statement
          </UButton>

          <UButton
            color="primary"
            size="lg"
            :loading="importing"
            :disabled="!canImport"
            @click="confirmImport"
          >
            {{ importing ? 'Importing...' : `Import ${reviewTransactions.length} Transactions` }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
