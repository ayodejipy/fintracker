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
        // Check if password is required
        if (extractionResult.requiresPassword) {
          passwordRequired.value = true
          error.value = extractionResult.error || 'This PDF is password protected'
          return {
            success: false,
            error: extractionResult.error,
          }
        }

        // If extraction fails, fall back to server-side processing
        console.warn('[Upload] Client-side extraction failed, falling back to server')
        return await uploadStatementFallback(file, password)
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
   * Fallback: Upload PDF to server for server-side extraction
   * Used when client-side extraction fails
   */
  async function uploadStatementFallback(
    file: File,
    password?: string,
  ): Promise<{ success: boolean, data?: BankStatementParseResult, error?: string }> {
    try {
      uploadStatus.value = 'Uploading PDF to server...'
      uploadProgress.value = 20

      const formData = new FormData()
      formData.append('statement', file)

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
          uploadStatus.value = 'Extracting PDF on server...'
          uploadProgress.value = 40
        },
        onResponse() {
          uploadStatus.value = 'Processing with AI...'
          uploadProgress.value = 70
        },
      })

      if (response.success) {
        uploadProgress.value = 90
        uploadStatus.value = 'Finalizing...'

        await new Promise(resolve => setTimeout(resolve, 300))

        uploadProgress.value = 100
        uploadStatus.value = 'Complete! Review your transactions below.'

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
      console.error('Fallback upload error:', err)

      uploadProgress.value = 0
      uploadStatus.value = ''

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
