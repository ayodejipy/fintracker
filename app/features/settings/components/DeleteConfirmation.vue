<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()

const openModal = defineModel<boolean>()

const deleteConfirmationText = ref('')

function cancelDelete() {
  emit('close')
}

function confirmDelete() {
  if (deleteConfirmationText.value === 'DELETE') {
    emit('delete')
    deleteConfirmationText.value = ''
  }
}
</script>

<template>
  <UModal v-model:open="openModal">
    <template #content>
      <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Account
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>Warning:</strong> This will permanently delete your account and all associated data
              including:
            </p>
            <ul class="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
              <li>All transactions and financial records</li>
              <li>Budgets and spending categories</li>
              <li>Savings goals and progress</li>
              <li>Loan information and payment history</li>
              <li>Account settings and preferences</li>
            </ul>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <strong>DELETE</strong> to confirm:
            </label>
            <UInput v-model="deleteConfirmationText" placeholder="DELETE" size="lg" class="font-mono" />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <UButton variant="ghost" size="lg" @click="cancelDelete">
            Cancel
          </UButton>
          <UButton
            :disabled="deleteConfirmationText !== 'DELETE' || loading" :loading="loading" color="error"
            size="lg" @click="confirmDelete"
          >
            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
            Delete Account
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
