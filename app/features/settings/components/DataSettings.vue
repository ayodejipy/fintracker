<script setup lang="ts">
interface Props {
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  exportData: [format: 'json' | 'csv']
  deleteAccount: []
}>()

const showDeleteConfirmation = ref(false)
const deleteConfirmationText = ref('')
const isExporting = ref(false)

function handleExport(format: 'json' | 'csv') {
  isExporting.value = true
  emit('exportData', format)

  // Reset loading state after a delay
  setTimeout(() => {
    isExporting.value = false
  }, 2000)
}

function confirmDelete() {
  if (deleteConfirmationText.value === 'DELETE') {
    emit('deleteAccount')
    showDeleteConfirmation.value = false
    deleteConfirmationText.value = ''
  }
}

function cancelDelete() {
  showDeleteConfirmation.value = false
  deleteConfirmationText.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <!-- Data Export -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Export Your Data
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Download a copy of all your financial data
          </p>
        </div>
      </div>

      <div class="space-y-6">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                What's Included
              </p>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Your export will include all transactions, budgets, savings goals, loans, and account settings.
                Personal information like passwords are not included for security reasons.
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- JSON Export -->
          <div class="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-code-bracket" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 class="text-md font-medium text-gray-900 dark:text-white">
                  JSON Format
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Structured data format
                </p>
              </div>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Best for developers or importing into other applications. Preserves all data relationships and metadata.
            </p>

            <UButton
              :loading="isExporting || loading"
              :disabled="isExporting || loading"
              size="lg"
              class="w-full"
              variant="outline"
              @click="handleExport('json')"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-2" />
              Export as JSON
            </UButton>
          </div>

          <!-- CSV Export -->
          <div class="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-300 dark:hover:border-green-500 transition-colors">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-table-cells" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 class="text-md font-medium text-gray-900 dark:text-white">
                  CSV Format
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Spreadsheet compatible
                </p>
              </div>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Perfect for Excel, Google Sheets, or other spreadsheet applications. Easy to analyze and manipulate.
            </p>

            <UButton
              :loading="isExporting || loading"
              :disabled="isExporting || loading"
              size="lg"
              class="w-full"
              variant="outline"
              @click="handleExport('csv')"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-2" />
              Export as CSV
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Management -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Account Management
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Manage your account and data
          </p>
        </div>
      </div>

      <div class="space-y-6">
        <!-- Danger Zone -->
        <div class="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <div class="flex items-start">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                Danger Zone
              </p>
              <p class="text-sm text-red-700 dark:text-red-300 mb-4">
                Once you delete your account, there is no going back. Please be certain.
                All your data including transactions, budgets, goals, and settings will be permanently removed.
              </p>

              <UButton
                :loading="loading"
                :disabled="loading"
                color="error"
                variant="outline"
                size="lg"
                @click="showDeleteConfirmation = true"
              >
                <UIcon name="i-heroicons-trash" class="size-4" />
                Delete Account
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmation v-model="showDeleteConfirmation" @close="cancelDelete" @delete="confirmDelete" />
  </div>
</template>
