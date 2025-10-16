import type { BankStatementParseResult } from '../../../app/types'
import { readMultipartFormData } from 'h3'
import { parseBankStatementWithLLM } from '../../utils/llmParser'
import { extractPDFText, PDFPasswordRequiredError, validateBankStatementPDF } from '../../utils/pdfParser'
import { categorizeTransactions } from '../../utils/transactionCategorizer'
import { getValidationSummary, validateTransactions } from '../../utils/transactionValidator'

/**
 * Upload and parse bank statement PDF
 * POST /api/statements/upload
 */
export default defineEventHandler(async (event) => {
  try {
    // Read uploaded file
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded',
      })
    }

    // Find the PDF file and password
    const pdfFile = formData.find(item => item.name === 'statement' || item.filename?.endsWith('.pdf'))
    const passwordField = formData.find(item => item.name === 'password')
    const password = passwordField?.data?.toString('utf-8')

    if (!pdfFile) {
      throw createError({
        statusCode: 400,
        message: 'No PDF file found in upload',
      })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (pdfFile.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        message: 'File size exceeds 10MB limit',
      })
    }

    // Validate file type
    if (!pdfFile.filename?.toLowerCase().endsWith('.pdf')) {
      throw createError({
        statusCode: 400,
        message: 'Only PDF files are allowed',
      })
    }

    // Step 1: Extract text from PDF
    let pdfText: string

    try {
      pdfText = await extractPDFText(pdfFile.data, password)
    }
    catch (error) {
      console.error('PDF extraction error:', error)

      // Check if password is required
      if (error instanceof PDFPasswordRequiredError) {
        throw createError({
          statusCode: 401,
          statusMessage: 'PASSWORD_REQUIRED',
          message: error.message,
        })
      }

      throw createError({
        statusCode: 422,
        message: 'Failed to read PDF. Please ensure it is a valid PDF file.',
      })
    }

    // Step 2: Validate it's actually a bank statement
    const validation = validateBankStatementPDF(pdfText)

    if (!validation.valid) {
      throw createError({
        statusCode: 422,
        message: validation.reason || 'This does not appear to be a bank statement',
      })
    }

    // Step 3: Parse transactions using LLM
    let parseResult: BankStatementParseResult

    try {
      const llmResult = await parseBankStatementWithLLM(pdfText)

      parseResult = {
        bankName: llmResult.bankName,
        accountNumber: llmResult.accountNumber,
        period: llmResult.period,
        transactions: llmResult.transactions,
        summary: {
          total: llmResult.transactions.length,
          autoCategorized: 0, // Will be updated after categorization
          needsReview: 0, // Will be updated after validation
          flagged: 0, // Will be updated after validation
        },
      }
    }
    catch (error) {
      console.error('LLM parsing error:', error)
      throw createError({
        statusCode: 422,
        message: 'Failed to parse statement transactions. The format may not be supported.',
      })
    }

    // Check if transactions were found
    if (parseResult.transactions.length === 0) {
      throw createError({
        statusCode: 422,
        message: 'No transactions found in the statement.',
      })
    }

    // Step 4: Categorize transactions
    const categorized = categorizeTransactions(parseResult.transactions)

    // Step 5: Validate and flag edge cases
    const validated = validateTransactions(categorized)

    // Step 6: Get summary statistics
    const summary = getValidationSummary(validated)

    // Update parse result with processed data
    const result: BankStatementParseResult = {
      ...parseResult,
      transactions: validated,
      summary: {
        total: summary.total,
        autoCategorized: summary.autoCategorized,
        needsReview: summary.needsReview,
        flagged: summary.flagged,
      },
    }

    // Return result for user review
    return {
      success: true,
      data: result,
      message: `Successfully parsed ${result.transactions.length} transactions from ${result.bankName}`,
    }
  }
  catch (error: any) {
    // Handle known errors
    if (error.statusCode) {
      throw error
    }

    // Handle unexpected errors
    console.error('Unexpected error in statement upload:', error)
    throw createError({
      statusCode: 500,
      message: 'An unexpected error occurred while processing your statement',
    })
  }
})
