import { handleApiError } from '~/utils/errorHandler'

/**
 * Composable for server-side PDF text extraction
 * Sends PDF file to server endpoint for extraction
 * This avoids browser compatibility issues with canvas and DOM APIs
 */
export function usePDFExtractor() {
  const extracting = ref(false)
  const extractionError = ref<string | null>(null)

  /**
   * Extract text from a PDF file
   * @param file - The PDF file to extract text from
   * @param password - Optional password for encrypted PDFs
   * @returns Extracted text or null if extraction fails
   */
  async function extractTextFromPDF(
    file: File,
    password?: string,
  ): Promise<{ success: boolean, text?: string, error?: string, requiresPassword?: boolean }> {
    extracting.value = true
    extractionError.value = null

    try {
      // Create form data with the PDF file
      const formData = new FormData()
      formData.append('file', file)

      if (password) {
        formData.append('password', password)
      }

      // Send to server for extraction
      const response = await $fetch<{
        success: boolean
        text?: string
        message: string
      }>('/api/statements/extract', {
        method: 'POST',
        body: formData,
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to extract text from PDF')
      }

      const extractedText = response.text

      if (!extractedText || extractedText.trim().length === 0) {
        return {
          success: false,
          error: 'No text could be extracted from the PDF. It may be an image-based PDF.',
        }
      }

      return {
        success: true,
        text: extractedText,
      }
    }
    catch (error: any) {
      // Use the standardized error handler
      const errorResult = handleApiError(error, 'extract text from PDF')

      extractionError.value = errorResult.error

      return {
        success: false,
        error: errorResult.error,
        requiresPassword: errorResult.requiresPassword,
      }
    }
    finally {
      extracting.value = false
    }
  }

  /**
   * Validate if extracted text looks like a bank statement
   */
  function validateBankStatementText(text: string): { valid: boolean, reason?: string } {
    const lowerText = text.toLowerCase()

    // Check for common bank statement indicators
    const hasTransactionKeywords = (
      lowerText.includes('transaction')
      || lowerText.includes('debit')
      || lowerText.includes('credit')
      || lowerText.includes('balance')
      || lowerText.includes('withdrawal')
      || lowerText.includes('deposit')
    )

    const hasBankKeywords = (
      lowerText.includes('bank')
      || lowerText.includes('statement')
      || lowerText.includes('account')
    )

    const hasAmountPatterns = /\d{1,3}(?:,\d{3})*\.\d{2}/.test(text)

    if (!hasTransactionKeywords && !hasBankKeywords) {
      return { valid: false, reason: 'Document does not appear to be a bank statement' }
    }

    if (!hasAmountPatterns) {
      return { valid: false, reason: 'No transaction data found in document' }
    }

    return { valid: true }
  }

  /**
   * Reset extraction state
   */
  function resetExtractionState() {
    extracting.value = false
    extractionError.value = null
  }

  return {
    // State
    extracting: readonly(extracting),
    extractionError: readonly(extractionError),

    // Methods
    extractTextFromPDF,
    validateBankStatementText,
    resetExtractionState,
  }
}
