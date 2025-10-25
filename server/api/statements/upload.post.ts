import type { BankStatementParseResult } from '../../../app/types'
import { readMultipartFormData } from 'h3'
import { getCategoriesForLLMPrompt } from '../../utils/categoryMapper'
import { parseBankStatementWithLLM } from '../../utils/llmParser'
import { validateBankStatementPDF } from '../../utils/pdfParser'
import { cleanAndNormalizeBankStatement } from '../../utils/textCleaning'
import { categorizeTransactions } from '../../utils/transactionCategorizerNew'
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

    // Get client-extracted text
    const extractedTextField = formData.find(item => item.name === 'extractedText')

    if (!extractedTextField?.data) {
      throw createError({
        statusCode: 400,
        message: 'No extracted text provided. PDF extraction must be done on the client.',
      })
    }

    // Step 1: Get PDF text from client
    console.log('[Upload] ✓ Using client-extracted PDF text')
    const pdfText = extractedTextField.data.toString('utf-8')

    if (!pdfText.trim()) {
      throw createError({
        statusCode: 422,
        message: 'Extracted text is empty. Please try uploading the PDF again.',
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

    // Step 3: Clean and normalize the text using SIMPLE approach
    console.log('\n==================== TEXT CLEANING: START ====================')
    console.log('[Text Cleaner] Starting simple text cleaning pipeline...')
    console.log('[Text Cleaner] Raw text length:', pdfText.length, 'characters')

    let cleaningResult

    try {
      cleaningResult = await cleanAndNormalizeBankStatement(pdfText, {
        bankType: 'auto', // Auto-detect bank type
        lookAheadRows: 3, // Look ahead 3 rows for fee grouping
        preserveOriginal: true, // Keep original for debugging
        verbose: true, // Enable detailed logging
      })

      console.log('[Text Cleaner] ✅ Cleaning completed successfully')
      console.log('[Text Cleaner] Stats:', {
        bankType: cleaningResult.bankType,
        totalTransactions: cleaningResult.stats.totalTransactions,
        transactionsWithFees: cleaningResult.stats.transactionsWithFees,
        totalFees: cleaningResult.stats.totalFees,
        processingTime: `${cleaningResult.stats.processingTimeMs}ms`,
      })

      console.log('\n[Text Cleaner] Cleaned text preview (first 800 chars):')
      console.log('---')
      console.log(cleaningResult.cleanedText.substring(0, 800))
      console.log('---')
      console.log('==================== TEXT CLEANING: END ====================\n')
    }
    catch (error) {
      console.error('\n[Text Cleaner] ❌ Error during cleaning:', error)
      console.warn('[Text Cleaner] Falling back to raw PDF text')
      console.log('==================== TEXT CLEANING: FAILED ====================\n')
      cleaningResult = null
    }

    // Step 4: Fetch categories for LLM
    console.log('[Upload] Fetching categories from database...')
    const categoriesPrompt = await getCategoriesForLLMPrompt()
    console.log('[Upload] Categories loaded for LLM')

    // Step 5: Parse transactions using LLM
    let parseResult: BankStatementParseResult

    try {
      // Use cleaned text if available, otherwise use raw text
      const textToParse = cleaningResult?.cleanedText || pdfText

      console.log('[Upload] Preparing to send to LLM...')
      console.log('[Upload] Using', cleaningResult ? 'CLEANED' : 'RAW', 'text')
      console.log('[Upload] Text length:', textToParse.length, 'characters')

      const llmResult = await parseBankStatementWithLLM(textToParse, categoriesPrompt)

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

    // Step 6: Categorize transactions
    console.log('Categorizing transactions...')
    const categorized = await categorizeTransactions(parseResult.transactions)

    // Step 7: Validate and flag edge cases
    console.log('Validating transactions...')
    const validated = validateTransactions(categorized)

    // Step 7: Get summary statistics
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
