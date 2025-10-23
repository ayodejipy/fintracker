/**
 * Simple Text Cleaning Pipeline
 *
 * This is a SIMPLIFIED approach that:
 * 1. Uses field mappings (constants) to normalize bank-specific columns
 * 2. Does basic cleanup (remove symbols, normalize whitespace)
 * 3. Groups related transactions (main + fees)
 * 4. Prepares clean data for LLM processing
 *
 * No complex parsing - LLM does the heavy lifting!
 */

import type { GroupedTransaction, RawTransactionRow } from './simpleTransactionGrouper'
import { detectBankFromText } from './bankFieldMappings'
import { getGroupingStats, groupTransactions, prepareForLLM } from './simpleTransactionGrouper'

/**
 * Options for the cleaning pipeline
 */
export interface SimpleCleaningOptions {
  // Bank type (auto-detect if not provided)
  bankType?: string

  // Look ahead rows for fee grouping (default: 3)
  lookAheadRows?: number

  // Enable verbose logging
  verbose?: boolean

  // Preserve original text for debugging
  preserveOriginal?: boolean
}

/**
 * Result of the cleaning pipeline
 */
export interface SimpleCleaningResult {
  // Cleaned text ready for LLM
  cleanedText: string

  // Original text (if preserveOriginal is true)
  originalText?: string

  // Grouped transactions
  groupedTransactions: GroupedTransaction[]

  // Data formatted for LLM
  llmData: Array<Record<string, unknown>>

  // Detected bank type
  bankType: string

  // Statistics
  stats: {
    originalCharCount: number
    cleanedCharCount: number
    totalTransactions: number
    transactionsWithFees: number
    totalFees: number
    processingTimeMs: number
  }

  // Debug info
  debug?: {
    warnings: string[]
    errors: string[]
  }
}

/**
 * Simple cleaning and normalization
 * Just basic cleanup - LLM handles the rest
 */
export async function cleanAndNormalizeBankStatement(
  rawText: string,
  options: SimpleCleaningOptions = {},
): Promise<SimpleCleaningResult> {
  const startTime = Date.now()
  const warnings: string[] = []
  const errors: string[] = []

  const {
    bankType: providedBankType,
    lookAheadRows = 3,
    verbose = false,
    preserveOriginal = false,
  } = options

  if (verbose) {
    console.log('[Simple Cleaner] Starting cleaning pipeline...')
    console.log('[Simple Cleaner] Input text length:', rawText.length)
  }

  // Step 1: Detect bank type
  const bankType = providedBankType || detectBankFromText(rawText)

  if (verbose) {
    console.log('[Simple Cleaner] Detected bank type:', bankType)
  }

  // Step 2: Basic cleanup - remove excessive noise but preserve structure
  let cleaned = rawText

  // Remove multiple pipes/dashes/equals (but keep single ones)
  cleaned = cleaned.replace(/\|{2,}/g, '|')
  cleaned = cleaned.replace(/-{2,}/g, '-')
  cleaned = cleaned.replace(/={2,}/g, '=')

  // Remove common noise symbols
  cleaned = cleaned.replace(/[*#~`]/g, '')

  // Normalize excessive whitespace (but keep structure)
  cleaned = cleaned.replace(/[ \t]{3,}/g, ' ') // 3+ spaces → 1 space
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n') // Max 3 blank lines

  if (verbose) {
    console.log('[Simple Cleaner] After basic cleanup:', cleaned.length, 'characters')
    console.log('[Simple Cleaner] Removed:', rawText.length - cleaned.length, 'characters')
  }

  // Step 3: Parse into transaction rows
  // This is bank-specific - you'll implement this based on your PDF parser output
  // For now, assume we get an array of transaction rows from somewhere
  const transactionRows: RawTransactionRow[] = []

  // TODO: Implement PDF table extraction
  // This should parse the PDF into rows and map columns using field mappings
  // Example:
  // const pdfRows = await extractPDFTable(pdfBuffer)
  // const mapping = getFieldMapping(bankType)
  // transactionRows = pdfRows.map(row => mapToStandardFields(row, mapping))

  if (verbose) {
    console.log('[Simple Cleaner] Extracted', transactionRows.length, 'transaction rows')
  }

  // Step 4: Group transactions with fees
  const grouped = groupTransactions(transactionRows, {
    lookAheadRows,
    cleanDescriptions: true,
  })

  if (verbose) {
    const stats = getGroupingStats(grouped)
    console.log('[Simple Cleaner] Grouping complete:', {
      totalTransactions: stats.totalTransactions,
      transactionsWithFees: stats.transactionsWithFees,
      totalFees: stats.totalFees,
    })
  }

  // Step 5: Prepare for LLM
  const llmData = prepareForLLM(grouped)

  if (verbose) {
    console.log('[Simple Cleaner] LLM data prepared:', llmData.length, 'entries')
    console.log('[Simple Cleaner] Sample LLM data (first entry):')
    console.log(JSON.stringify(llmData[0], null, 2))
  }

  // Step 6: Format cleaned text for LLM
  // Simple pipe-delimited format
  const cleanedLines = llmData.map((entry) => {
    const parts = [
      `DATE: ${entry.date}`,
      `DESC: ${entry.description}`,
      `AMOUNT: ${entry.amount}`,
      `TYPE: ${entry.type}`,
      `BALANCE: ${entry.balance}`,
    ]

    // Add fee breakdown if present
    if (entry.hasFees && Array.isArray(entry.feeBreakdown) && entry.feeBreakdown.length > 0) {
      const totalFees = entry.feeBreakdown.reduce((sum: number, fee: { amount: number, description: string }) => sum + fee.amount, 0)
      parts.push(`FEES: ${totalFees}`)

      entry.feeBreakdown.forEach((fee: { amount: number, description: string }) => {
        parts.push(`${fee.description.toUpperCase()}: ${fee.amount}`)
      })
    }

    if (entry.reference) {
      parts.push(`REF: ${entry.reference}`)
    }

    return parts.join(' | ')
  })

  const cleanedText = cleanedLines.join('\n')

  const processingTimeMs = Date.now() - startTime

  if (verbose) {
    console.log('[Simple Cleaner] ✅ Pipeline complete in', processingTimeMs, 'ms')
    console.log('[Simple Cleaner] Cleaned text preview (first 500 chars):')
    console.log(cleanedText.substring(0, 500))
  }

  // Build result
  const result: SimpleCleaningResult = {
    cleanedText,
    originalText: preserveOriginal ? rawText : undefined,
    groupedTransactions: grouped,
    llmData,
    bankType,
    stats: {
      originalCharCount: rawText.length,
      cleanedCharCount: cleanedText.length,
      totalTransactions: grouped.length,
      transactionsWithFees: grouped.filter(t => t.hasFees).length,
      totalFees: grouped.reduce((sum, t) => sum + t.fees.length, 0),
      processingTimeMs,
    },
  }

  if (warnings.length > 0 || errors.length > 0) {
    result.debug = { warnings, errors }
  }

  return result
}

/**
 * Quick clean - minimal processing
 */
export function quickClean(text: string): string {
  let cleaned = text

  // Basic cleanup
  cleaned = cleaned.replace(/\|{2,}/g, '|')
  cleaned = cleaned.replace(/-{2,}/g, '-')
  cleaned = cleaned.replace(/[*#~`]/g, '')
  cleaned = cleaned.replace(/[ \t]{3,}/g, ' ')
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')

  return cleaned.trim()
}

/**
 * Export all utilities
 */
export * from './bankFieldMappings'
export * from './simpleTransactionGrouper'
