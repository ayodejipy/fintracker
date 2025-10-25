import { PDFParse } from 'pdf-parse'

/**
 * PDF Parser for Bank Statements
 * Extracts text from PDF for LLM processing
 */

/**
 * Custom error for password-protected PDFs
 */
export class PDFPasswordRequiredError extends Error {
  constructor(message = 'PDF is password protected') {
    super(message)
    this.name = 'PDFPasswordRequiredError'
  }
}

/**
 * Extract text from PDF (with optional password)
 */
export async function extractPDFText(pdfBuffer: Buffer, password?: string): Promise<string> {
  try {
    const options: { data: Buffer, password?: string } = { data: pdfBuffer }

    // Add password if provided
    if (password) {
      options.password = password
    }

    const data = new PDFParse(options)
    const result = await data.getText()

    return result.text
  }
  catch (error) {
    // Check if it's a password error
    if (error instanceof Error && (
      error.message.includes('No password given')
      || error.message.includes('password')
      || error.message.includes('encrypted')
    )) {
      throw new PDFPasswordRequiredError('This PDF is password protected. Please provide the password.')
    }

    // Re-throw other errors
    throw error
  }
}

/**
 * Validate if text looks like a bank statement
 */
export function validateBankStatementPDF(text: string): { valid: boolean, reason?: string } {
  const lowerText = text.toLowerCase()

  console.log('Validating bank statement PDF...', lowerText)

  // Check for common bank statement indicators
  const hasTransactionKeywords = (
    lowerText.includes('transaction')
    || lowerText.includes('transaction details')
    || lowerText.includes('debit')
    || lowerText.includes('credit')
    || lowerText.includes('balance')
    || lowerText.includes('withdrawal')
    || lowerText.includes('deposit')
    || lowerText.includes('remarks')
  )

  const hasBankKeywords = (
    lowerText.includes('bank')
    || lowerText.includes('statement')
    || lowerText.includes('account')
  )

  // const hasDatePatterns = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(text)
  const hasAmountPatterns = /\d{1,3}(?:,\d{3})*\.\d{2}/.test(text)

  if (!hasTransactionKeywords && !hasBankKeywords) {
    return { valid: false, reason: 'Document does not appear to be a bank statement' }
  }

  if (!hasAmountPatterns) {
    return { valid: false, reason: 'No transaction data found in document' }
  }

  return { valid: true }
}
