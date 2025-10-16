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
      <UCard v-if="!parseResult">
        <div class="max-w-2xl mx-auto">
          <!-- File Upload -->
          <UFileUpload
            v-model="uploadedFile"
            accept=".pdf"
            label="Drop your bank statement here"
            description="Supports PDF files up to 10MB"
            icon="i-heroicons-document-arrow-up"
            variant="area"
            size="lg"
            class="min-h-48"
            @change="handleFileChange"
          />

          <!-- Password Input (shown when password is required) -->
          <div v-if="passwordRequired && uploadedFile" class="mt-6">
            <UAlert
              color="warning"
              variant="subtle"
              title="Password Required"
              description="This PDF is password protected. Please enter the password to continue."
              class="mb-4"
            />

            <div class="flex gap-3">
              <UInput
                v-model="password"
                type="password"
                placeholder="Enter PDF password"
                size="lg"
                icon="i-heroicons-lock-closed"
                class="flex-1"
                @keyup.enter="uploadStatement"
              />
              <UButton
                color="primary"
                size="lg"
                :loading="uploading"
                :disabled="!password"
                @click="uploadStatement"
              >
                {{ uploading ? 'Processing...' : 'Unlock & Parse' }}
              </UButton>
            </div>
          </div>

          <!-- Upload Button (shown when no password required) -->
          <div v-else-if="uploadedFile && !passwordRequired" class="mt-6">
            <!-- Progress Status (shown during upload) -->
            <div v-if="uploading" class="space-y-4 max-w-md mx-auto">
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="animate-spin">
                    <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-blue-600" />
                  </div>
                  <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {{ uploadStatus }}
                  </span>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-blue-600 h-full transition-all duration-500 ease-out"
                    :style="{ width: `${uploadProgress}%` }"
                  />
                </div>

                <div class="mt-2 text-right">
                  <span class="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    {{ uploadProgress }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Upload Button (shown when not uploading) -->
            <div v-else class="flex justify-center">
              <UButton
                color="primary"
                size="lg"
                @click="uploadStatement"
              >
                Upload & Parse Statement
              </UButton>
            </div>
          </div>

          <!-- Error Message -->
          <UAlert
            v-if="error && !passwordRequired"
            color="error"
            variant="subtle"
            :title="error"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
            class="mt-6"
            @close="error = null"
          />
        </div>
      </UCard>

      <!-- Review Section -->
      <div v-else class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {{ parseResult.summary.total }}
            </p>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6">
            <p class="text-sm text-green-700 dark:text-green-400">Auto-Categorized</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">
              {{ parseResult.summary.autoCategorized }}
            </p>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6">
            <p class="text-sm text-yellow-700 dark:text-yellow-400">Needs Review</p>
            <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-2">
              {{ parseResult.summary.needsReview }}
            </p>
          </div>

          <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6">
            <p class="text-sm text-red-700 dark:text-red-400">Flagged</p>
            <p class="text-3xl font-bold text-red-600 dark:text-red-500 mt-2">
              {{ parseResult.summary.flagged }}
            </p>
          </div>
        </div>

        <!-- Statement Info -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-building-library" class="w-5 h-5 text-blue-600" />
              <span class="font-medium text-blue-900 dark:text-blue-100">{{ parseResult.bankName }}</span>
            </div>

            <div v-if="parseResult.accountNumber" class="flex items-center gap-2">
              <UIcon name="i-heroicons-credit-card" class="w-5 h-5 text-blue-600" />
              <span class="text-blue-900 dark:text-blue-100">{{ parseResult.accountNumber }}</span>
            </div>

            <div v-if="parseResult.period" class="flex items-center gap-2">
              <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-blue-600" />
              <span class="text-blue-900 dark:text-blue-100">
                {{ parseResult.period.from }} to {{ parseResult.period.to }}
              </span>
            </div>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Review Transactions
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please review and edit transactions before importing
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(transaction, index) in reviewTransactions"
                  :key="index"
                  :class="{
                    'bg-yellow-50 dark:bg-yellow-900/10': transaction.needsReview,
                    'bg-red-50 dark:bg-red-900/10': transaction.flags && transaction.flags.length > 0,
                  }"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {{ formatDate(transaction.date) }}
                  </td>

                  <td class="px-6 py-4 text-sm">
                    <input
                      v-model="transaction.description"
                      type="text"
                      class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter description"
                    >
                    <div v-if="transaction.flags && transaction.flags.length > 0" class="mt-1 flex flex-wrap gap-1">
                      <span
                        v-for="flag in transaction.flags"
                        :key="flag"
                        class="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      >
                        {{ getFlagLabel(flag) }}
                      </span>
                    </div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span :class="transaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ transaction.type === 'credit' ? '+' : '-' }}₦{{ formatAmount(transaction.amount) }}
                    </span>
                  </td>

                  <td class="px-6 py-4">
                    <select
                      v-model="transaction.category"
                      class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="">Select category</option>
                      <option value="food">Food & Dining</option>
                      <option value="transport">Transport</option>
                      <option value="data_airtime">Data & Airtime</option>
                      <option value="rent">Rent</option>
                      <option value="home_allowance">Home & Utilities</option>
                      <option value="loan_repayment">Loan Repayment</option>
                      <option value="savings">Savings</option>
                      <option value="miscellaneous">Miscellaneous</option>
                    </select>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      v-if="transaction.confidence"
                      class="px-2 py-1 rounded text-xs font-medium"
                      :class="{
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': transaction.confidence === 'high',
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300': transaction.confidence === 'medium' || transaction.confidence === 'low',
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300': transaction.confidence === 'manual',
                      }"
                    >
                      {{ transaction.confidence }}
                    </span>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <UButton
                      color="error"
                      variant="ghost"
                      size="xs"
                      icon="i-heroicons-trash"
                      @click="removeTransaction(index)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

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
            :disabled="reviewTransactions.length === 0"
            @click="confirmImport"
          >
            {{ importing ? 'Importing...' : `Import ${reviewTransactions.length} Transactions` }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BankStatementParseResult, ParsedTransaction, BulkImportRequest } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
  title: 'Import Bank Statement',
})

// State
const uploadedFile = ref<File | null>(null)
const uploading = ref(false)
const importing = ref(false)
const error = ref<string | null>(null)
const parseResult = ref<BankStatementParseResult | null>(null)
const reviewTransactions = ref<ParsedTransaction[]>([])
const passwordRequired = ref(false)
const password = ref('')
const uploadStatus = ref<string>('')
const uploadProgress = ref<number>(0)

// File handling
function handleFileChange() {
  error.value = null
  passwordRequired.value = false
  password.value = ''
}

// Upload and parse
async function uploadStatement() {
  if (!uploadedFile.value)
    return

  const file = uploadedFile.value
  if (!file)
    return

  uploading.value = true
  error.value = null
  uploadProgress.value = 0

  try {
    // Step 1: Preparing upload
    uploadStatus.value = 'Preparing file upload...'
    uploadProgress.value = 10
    await new Promise(resolve => setTimeout(resolve, 300))

    const formData = new FormData()
    formData.append('statement', file)

    // Add password if provided
    if (password.value) {
      formData.append('password', password.value)
      uploadStatus.value = 'Unlocking PDF with password...'
    }
    else {
      uploadStatus.value = 'Uploading bank statement...'
    }
    uploadProgress.value = 25

    // Step 2: Upload file
    await new Promise(resolve => setTimeout(resolve, 400))
    uploadProgress.value = 50

    uploadStatus.value = 'Extracting text from PDF...'
    await new Promise(resolve => setTimeout(resolve, 300))
    uploadProgress.value = 65

    uploadStatus.value = 'Analyzing transactions with AI...'
    const response = await $fetch<{ success: boolean, data: BankStatementParseResult, message: string }>('/api/statements/upload', {
      method: 'POST',
      body: formData,
    })

    uploadProgress.value = 85
    uploadStatus.value = 'Categorizing transactions...'
    await new Promise(resolve => setTimeout(resolve, 300))

    if (response.success) {
      uploadProgress.value = 100
      uploadStatus.value = 'Complete! Review your transactions below.'
      await new Promise(resolve => setTimeout(resolve, 500))

      parseResult.value = response.data
      reviewTransactions.value = [...response.data.transactions]
      passwordRequired.value = false
      password.value = ''
    }
  }
  catch (err: any) {
    uploadProgress.value = 0
    uploadStatus.value = ''

    // Check if password is required
    if (err.statusCode === 401 && err.statusMessage === 'PASSWORD_REQUIRED') {
      passwordRequired.value = true
      error.value = err.data?.message || 'This PDF is password protected. Please enter the password.'
    }
    else {
      error.value = err.data?.message || 'Failed to parse statement. Please try again.'
    }
  }
  finally {
    uploading.value = false
  }
}

// Import confirmed transactions
async function confirmImport() {
  if (!parseResult.value || reviewTransactions.value.length === 0)
    return

  importing.value = true

  try {
    const importRequest: BulkImportRequest = {
      transactions: reviewTransactions.value.map((t: ParsedTransaction) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type === 'debit' ? 'expense' : 'income',
        category: t.category!,
      })),
      importSource: parseResult.value.bankName,
    }

    const response = await $fetch('/api/statements/import', {
      method: 'POST',
      body: importRequest,
    })

    if (response.success) {
      // Clear Nuxt data cache to refresh dashboard and transactions
      await clearNuxtData()

      // Show success message and redirect to transactions page
      navigateTo('/transactions?imported=true')
    }
  }
  catch (err: any) {
    error.value = err.data?.message || 'Failed to import transactions. Please try again.'
  }
  finally {
    importing.value = false
  }
}

// Remove transaction from review list
function removeTransaction(index: number) {
  reviewTransactions.value.splice(index, 1)
}

// Reset and upload new file
function resetUpload() {
  parseResult.value = null
  reviewTransactions.value = []
  uploadedFile.value = null
  error.value = null
}

// Utility functions

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(amount)
}

function getFlagLabel(flag: string): string {
  const labels: Record<string, string> = {
    NO_DESCRIPTION: 'No Description',
    GENERIC_DESCRIPTION: 'Generic',
    ONLY_NUMBERS: 'Ref Only',
    AMBIGUOUS: 'Ambiguous',
    UNUSUAL_AMOUNT: 'Unusual Amount',
    DUPLICATE_SUSPECTED: 'Possible Duplicate',
  }
  return labels[flag] || flag
}
</script>
