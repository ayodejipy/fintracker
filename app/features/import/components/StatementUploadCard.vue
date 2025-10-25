<script setup lang="ts">
import { formatFileSize } from '../utils/fileHelpers'

// Props
interface Props {
  uploading?: boolean
  error?: string | null
  passwordRequired?: boolean
}

withDefaults(defineProps<Props>(), {
  uploading: false,
  error: null,
  passwordRequired: false,
})

// Emits
const emit = defineEmits<{
  upload: [file: File, password?: string]
  fileChange: []
}>()

// State
const uploadedFile = ref<File | null>(null)
const password = ref('')

// Handle file change
function handleFileChange() {
  password.value = ''
  emit('fileChange')
}

// Handle upload
function handleUpload() {
  if (!uploadedFile.value) { return }

  emit('upload', uploadedFile.value, password.value || undefined)
}
</script>

<template>
  <UCard>
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
          v-if="!error || !error.includes('Incorrect')"
          color="warning"
          variant="subtle"
          title="Password Required"
          description="This PDF is password protected. Please enter the password to continue."
          class="mb-4"
        />

        <!-- Show error alert for incorrect password -->
        <UAlert
          v-else
          color="error"
          variant="subtle"
          title="Incorrect Password"
          :description="error"
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
            :status="error?.includes('Incorrect') ? 'error' : undefined"
            @keyup.enter="handleUpload"
          />
          <UButton
            color="primary"
            size="lg"
            :loading="uploading"
            :disabled="!password"
            @click="handleUpload"
          >
            {{ uploading ? 'Processing...' : 'Unlock & Parse' }}
          </UButton>
        </div>
      </div>

      <!-- Upload Button (shown when no password required) -->
      <div v-else-if="uploadedFile && !passwordRequired" class="mt-6">
        <!-- File Info Card (shown before upload) -->
        <div v-if="!uploading" class="space-y-4">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <UIcon name="i-heroicons-document-text" class="w-10 h-10 text-blue-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ uploadedFile.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatFileSize(uploadedFile.size) }} • Ready to parse
                </p>
              </div>
              <div class="flex-shrink-0">
                <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div class="flex justify-center">
            <UButton
              color="primary"
              size="lg"
              icon="i-heroicons-cloud-arrow-up"
              @click="handleUpload"
            >
              Upload & Parse Statement
            </UButton>
          </div>
        </div>

        <!-- Progress indicator slot -->
        <slot v-else name="progress" />
      </div>

      <!-- Error Message -->
      <UAlert
        v-if="error && !passwordRequired"
        color="error"
        variant="subtle"
        :title="error"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'error', variant: 'link' }"
        class="mt-6"
      />
    </div>
  </UCard>
</template>
