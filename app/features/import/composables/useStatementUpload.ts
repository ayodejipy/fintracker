import type { BankStatementParseResult } from '~/types'

/**
 * Composable for handling bank statement upload and parsing
 */
export function useStatementUpload() {
  const uploading = ref(false)
  const uploadStatus = ref<string>('')
  const uploadProgress = ref<number>(0)
  const error = ref<string | null>(null)
  const passwordRequired = ref(false)

  /**
   * Upload and parse bank statement
   */
  async function uploadStatement(
    file: File,
    password?: string,
  ): Promise<{ success: boolean, data?: BankStatementParseResult, error?: string }> {
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Reset state
    uploading.value = true
    error.value = null
    passwordRequired.value = false
    uploadProgress.value = 0
    uploadStatus.value = 'Starting upload...'

    try {
      // Create form data
      const formData = new FormData()
      formData.append('statement', file)

      if (password) {
        formData.append('password', password)
        uploadStatus.value = 'Unlocking PDF with password...'
        uploadProgress.value = 15
      }
      else {
        uploadStatus.value = 'Uploading bank statement...'
        uploadProgress.value = 10
      }

      // Upload file and parse
      uploadStatus.value = 'Uploading to server...'
      uploadProgress.value = 25

      const response = await $fetch<{
        success: boolean
        data: BankStatementParseResult
        message: string
      }>('/api/statements/upload', {
        method: 'POST',
        body: formData,
        onRequest() {
          uploadStatus.value = 'Extracting PDF text...'
          uploadProgress.value = 50
        },
        onResponse() {
          uploadStatus.value = 'Analyzing transactions with AI...'
          uploadProgress.value = 75
        },
      })

      if (response.success) {
        uploadProgress.value = 90
        uploadStatus.value = 'Categorizing and validating...'

        // Small delay to show completion state
        await new Promise(resolve => setTimeout(resolve, 300))

        uploadProgress.value = 100
        uploadStatus.value = 'Complete! Review your transactions below.'

        // Let user see completion message
        await new Promise(resolve => setTimeout(resolve, 500))

        return {
          success: true,
          data: response.data,
        }
      }

      return {
        success: false,
        error: response.message || 'Failed to parse statement',
      }
    }
    catch (err: any) {
      console.error('Upload error:', err)

      // Reset progress on error
      uploadProgress.value = 0
      uploadStatus.value = ''

      // Check if password is required
      if (err.statusCode === 401 && err.statusMessage === 'PASSWORD_REQUIRED') {
        passwordRequired.value = true
        const errorMessage = err.data?.message || 'This PDF is password protected'
        error.value = errorMessage

        return {
          success: false,
          error: errorMessage,
        }
      }

      const errorMessage = err.data?.message || err.message || 'Failed to parse statement'
      error.value = errorMessage

      return {
        success: false,
        error: errorMessage,
      }
    }
    finally {
      uploading.value = false
    }
  }

  /**
   * Reset upload state
   */
  function resetUploadState() {
    uploading.value = false
    uploadStatus.value = ''
    uploadProgress.value = 0
    error.value = null
    passwordRequired.value = false
  }

  return {
    // State
    uploading: readonly(uploading),
    uploadStatus: readonly(uploadStatus),
    uploadProgress: readonly(uploadProgress),
    error: readonly(error),
    passwordRequired: readonly(passwordRequired),

    // Methods
    uploadStatement,
    resetUploadState,
  }
}
