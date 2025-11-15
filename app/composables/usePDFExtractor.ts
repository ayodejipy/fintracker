import { PDFParse } from 'pdf-parse'

/**
 * Composable for client-side PDF text extraction using pdf-parse
 * PDF extraction runs entirely on the client
 * Only extracted text is sent to server for LLM processing
 */
export function usePDFExtractor() {
  const extracting = ref(false)
  const extractionError = ref<string | null>(null)

  /**
   * Extract text from a PDF file on the client-side
   * @param file - The PDF file to extract text from
   * @param password - Optional password for encrypted PDFs
   * @returns Extracted text or error
   */
  async function extractTextFromPDF(
    file: File,
    password?: string,
  ): Promise<{ success: boolean, text?: string, error?: string, requiresPassword?: boolean }> {
    extracting.value = true
    extractionError.value = null

    try {
      // Configure the worker for pdf-parse in browser environment
      PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs')

      // Convert File to Uint8Array for pdf-parse
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const options: { data: Uint8Array | ArrayBuffer, password?: string } = { data: buffer }

      if (password) {
        options.password = password
      }

      const parser = new PDFParse(options)
      const result = await parser.getText()

      if (!result.text || result.text.trim().length === 0) {
        return {
          success: false,
          error: 'No text could be extracted from the PDF. It may be an image-based PDF.',
        }
      }

      return {
        success: true,
        text: result.text,
      }
    }
    catch (error: any) {
      const errorMsg = error.message || ''
      const isPasswordError = errorMsg.includes('password') || errorMsg.includes('encrypted') || errorMsg.includes('No password given')
      const isIncorrectPassword = password && (errorMsg.includes('incorrect') || errorMsg.includes('invalid') || errorMsg.includes('wrong'))

      if (isPasswordError || isIncorrectPassword) {
        const errorMessage = isIncorrectPassword
          ? 'Incorrect password. Please try again.'
          : 'This PDF is password protected. Please provide the password.'

        extractionError.value = errorMessage

        return {
          success: false,
          error: errorMessage,
          requiresPassword: true,
        }
      }

      const errorMessage = errorMsg || 'Failed to extract text from PDF'
      extractionError.value = errorMessage

      return {
        success: false,
        error: errorMessage,
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
