import type { BankStatementParseResult } from '~/types'
import { handleApiError } from '~/utils/errorHandler'

/**
 * Composable for handling bank statement upload and parsing
 */
export function useStatementUpload() {
  const uploading = ref(false)
  const uploadStatus = ref<string>('')
  const uploadProgress = ref<number>(0)
  const error = ref<string | null>(null)
  const passwordRequired = ref(false)

  // Use PDF extractor composable
  const { extractTextFromPDF, validateBankStatementText } = usePDFExtractor()

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
      // Step 1: Extract text from PDF on client-side
      uploadStatus.value = 'Reading PDF file...'
      uploadProgress.value = 10

      const extractionResult = await extractTextFromPDF(file, password)

      if (!extractionResult.success) {
        // Check if password is required or incorrect
        if (extractionResult.requiresPassword) {
          passwordRequired.value = true
          error.value = extractionResult.error || 'This PDF is password protected'

          // Keep the upload state visible so user can retry with correct password
          uploadProgress.value = 0
          uploadStatus.value = ''

          return {
            success: false,
            error: extractionResult.error,
          }
        }

        // Extraction failed - return error (no server fallback)
        error.value = extractionResult.error || 'Failed to extract text from PDF'

        // Reset progress
        uploadProgress.value = 0
        uploadStatus.value = ''

        return {
          success: false,
          error: error.value,
        }
      }

      // Step 2: Validate extracted text
      uploadStatus.value = 'Validating document...'
      uploadProgress.value = 20

      const validation = validateBankStatementText(extractionResult.text!)

      if (!validation.valid) {
        error.value = validation.reason || 'This does not appear to be a bank statement'
        return {
          success: false,
          error: error.value,
        }
      }

      // Step 3: Send extracted text to server for processing
      uploadStatus.value = 'Sending to server for processing...'
      uploadProgress.value = 30

      const formData = new FormData()
      formData.append('extractedText', extractionResult.text!)

      if (password) {
        formData.append('password', password)
      }

      const response = await $fetch<{
        success: boolean
        data: BankStatementParseResult
        message: string
      }>('/api/statements/upload', {
        method: 'POST',
        body: formData,
        onRequest() {
          uploadStatus.value = 'Processing with AI...'
          uploadProgress.value = 50
        },
        onResponse() {
          uploadStatus.value = 'Categorizing transactions...'
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
      // Use the standardized error handler
      const errorResult = handleApiError(err, 'parse statement')

      // Reset progress on error
      uploadProgress.value = 0
      uploadStatus.value = ''

      // Check if password is required
      if (errorResult.requiresPassword) {
        passwordRequired.value = true
      }

      error.value = errorResult.error

      return {
        success: false,
        error: errorResult.error,
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
