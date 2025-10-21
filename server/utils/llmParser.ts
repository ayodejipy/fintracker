import type { ParsedTransaction } from '../../app/types'
import { GoogleGenAI, Type } from '@google/genai'

/**
 * LLM-based transaction parser
 * Uses AI to extract transactions from bank statement text
 */

interface LLMParseResult {
  transactions: ParsedTransaction[]
  bankName: string
  accountNumber?: string
  period?: {
    from: string
    to: string
  }
}

/**
 * Parse bank statement text using LLM
 */
export async function parseBankStatementWithLLM(text: string, categoriesPrompt?: string): Promise<LLMParseResult> {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
  }

  console.log('\n==================== LLM PARSER: START ====================')
  console.log('[LLM Parser] Input text length:', text.length, 'characters')
  console.log('[LLM Parser] Input text preview (first 800 chars):')
  console.log('---')
  console.log(text.substring(0, 800))
  console.log('---')

  const prompt = buildParsingPrompt(text, categoriesPrompt)
  console.log('[LLM Parser] Prompt built, sending to Gemini 2.5 Flash...')

  const ai = new GoogleGenAI({})

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: {
          includeThoughts: true,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bankName: {
                type: Type.STRING,
              },
              accountNumber: {
                type: Type.STRING,
                nullable: true,
              },
              period: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                },
                required: ['from', 'to'],
                nullable: true,
              },
              transactions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    description: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    type: { type: Type.STRING, enum: ['debit', 'credit'] },
                    category: { type: Type.STRING, nullable: true }, // Category value (e.g., "food_groceries")
                    balance: { type: Type.NUMBER, nullable: true },
                    // Fee breakdown fields (all optional)
                    vat: { type: Type.NUMBER, nullable: true },
                    serviceFee: { type: Type.NUMBER, nullable: true },
                    commission: { type: Type.NUMBER, nullable: true },
                    stampDuty: { type: Type.NUMBER, nullable: true },
                    transferFee: { type: Type.NUMBER, nullable: true },
                    processingFee: { type: Type.NUMBER, nullable: true },
                    otherFees: { type: Type.NUMBER, nullable: true },
                    feeNote: { type: Type.STRING, nullable: true },
                  },
                  required: ['date', 'description', 'amount', 'type'],
                },
              },
            },
            propertyOrdering: ['bankName', 'accountNumber', 'period', 'transactions'],
          },
        },
      },
    })

    console.log('[LLM Parser] ✅ Response received from Gemini')

    if (response.promptFeedback?.blockReason) {
      console.error('[LLM Parser] ❌ Request blocked:', response.promptFeedback.blockReason)
      throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`)
    }

    const content = response.text

    if (!content) {
      console.error('[LLM Parser] ❌ No response content')
      throw new Error('No response from LLM')
    }

    console.log('\n==================== LLM PARSER: RAW RESPONSE ====================')
    console.log('[LLM Parser] Response length:', content.length, 'characters')
    console.log('[LLM Parser] Full response:')
    console.log('---')
    console.log(content)
    console.log('---')

    const parsed = JSON.parse(content) as unknown as LLMParseResult[]

    console.log('[LLM Parser] ✅ Response parsed successfully')
    console.log('[LLM Parser] Transactions found:', parsed[0]?.transactions?.length || 0)

    // Validate and normalize the response
    const validated = validateAndNormalizeLLMResponse(parsed[0])

    console.log('[LLM Parser] ✅ Response validated and normalized')
    console.log('[LLM Parser] Final transaction count:', validated.transactions.length)
    console.log('[LLM Parser] Bank name:', validated.bankName)
    console.log('[LLM Parser] Account number:', validated.accountNumber || 'N/A')
    console.log('[LLM Parser] Period:', validated.period ? `${validated.period.from} to ${validated.period.to}` : 'N/A')

    // Log sample transactions
    if (validated.transactions.length > 0) {
      console.log('\n[LLM Parser] Sample transactions (first 3):')
      validated.transactions.slice(0, 3).forEach((txn, idx) => {
        console.log(`\n  Transaction ${idx + 1}:`)
        console.log(`    Date: ${txn.date}`)
        console.log(`    Description: ${txn.description}`)
        console.log(`    Amount: ${txn.amount} (main transaction)`)
        console.log(`    Type: ${txn.type}`)
        console.log(`    Balance: ${txn.balance || 'N/A'}`)
        if (txn.commission || txn.vat || txn.stampDuty || txn.serviceFee || txn.transferFee || txn.processingFee || txn.otherFees) {
          console.log('    Fees:', {
            commission: txn.commission || 0,
            vat: txn.vat || 0,
            stampDuty: txn.stampDuty || 0,
            serviceFee: txn.serviceFee || 0,
            transferFee: txn.transferFee || 0,
            processingFee: txn.processingFee || 0,
            otherFees: txn.otherFees || 0,
          })
          console.log(`    TOTAL (amount + fees): ${txn.total}`)
        }
      })
    }

    console.log('\n==================== LLM PARSER: END ====================\n')

    return validated
  }
  catch (error) {
    console.error('\n==================== LLM PARSER: ERROR ====================')
    console.error('[LLM Parser] ❌ Error:', error)
    console.error('==================== LLM PARSER: ERROR END ====================\n')
    throw error
  }
}

/**
 * Build the prompt for LLM parsing
 */
function buildParsingPrompt(statementText: string, categoriesPrompt?: string): string {
  return `
As a finance expert, I need you to parse the following bank statement and extract ALL transactions in JSON format.

${categoriesPrompt ? `\nAVAILABLE CATEGORIES:\n${categoriesPrompt}\n\nIMPORTANT: You MUST use ONLY the category names listed above. Do not create new categories.\n` : ''}

IMPORTANT CONTEXT:
The text below has been PRE-PROCESSED and CLEANED for you:
- Currency symbols have been removed (amounts are plain numbers)
- Whitespace has been normalized
- Transactions are formatted with pipe delimiters (|)
- Related fees have been PRE-GROUPED with their main transactions

CRITICAL INSTRUCTIONS:
1. Extract every single transaction from the statement
2. Identify if each transaction is a debit (money out) or credit (money in)
3. Parse dates in ISO format (YYYY-MM-DD)
4. Extract amounts as numbers (already cleaned, no currency symbols)
5. Include the original description exactly as it appears
6. Extract bank name, account number, and statement period if available
7. **CATEGORIZE EACH TRANSACTION**:
   - Analyze the transaction description and assign the most appropriate category VALUE
   - Use ONLY the category values from the list above (e.g., "food_groceries", NOT "Food & Groceries")
   - For debits/expenses, use expense categories
   - For credits/income, use income categories
   - If unsure, use "miscellaneous" for expenses or "other_income" for income
   - Look at the examples provided for each category to guide your decision

8. **HANDLE PRE-GROUPED FEES CORRECTLY**:

   When you see a line like:
   "DATE: 01-Sep-2025 | DESC: NIP TRANSFER | AMOUNT: 9800 | FEES: 26.88 | COMMISSION: 25 | VAT: 1.88 | TOTAL: 9826.88"

   This means:
   - The MAIN transaction amount is 9800 (what the user actually purchased/transferred)
   - The TOTAL amount debited from account is 9826.88 (main + fees)
   - COMMISSION: 25 is a separate fee
   - VAT: 1.88 is a separate fee
   - These fees are ALREADY GROUPED - DO NOT create separate transaction entries for them!

8. **Fee Extraction Rules**:
   - If you see fields like FEES:, VAT:, COMMISSION:, STAMP_DUTY:, etc., extract them to their respective fee fields
   - The 'amount' field should be the MAIN transaction amount (NOT including fees)
   - Use the TOTAL field (if present) to populate balance calculation
   - Fee types include:
     * VAT/Tax (typically 7.5% in Nigeria)
     * Service fees (restaurant/hotel charges - NOT for bank service charges)
     * Commission (bank/payment processor fees)
     * Stamp duty (₦50 for transfers >₦10,000 in Nigeria)
     * Transfer fees (inter-bank transfer charges)
     * Processing fees (payment processing charges)
     * Other fees (miscellaneous charges)

9. **IMPORTANT - Bank Service Charge Transactions**:
   - For transactions that ARE THEMSELVES service charges (SMS charges, account maintenance fees, monthly service fees, etc.):
     * The 'amount' field IS the service charge - DO NOT duplicate it in 'serviceFee' field
     * Only use 'serviceFee' for additional service fees on TOP of a main transaction
     * Example: "SMS ALERT CHARGE FOR 29-AUG-2025 to 28-SEP-2025" with amount 192.00
       → amount: 192.00, serviceFee: undefined (or 0), vat: 14.40
       → The 192.00 IS the charge itself, not a fee on top of something else
   - For regular transactions WITH service fees (e.g., restaurant bill with service charge):
     * The 'amount' is the base transaction, 'serviceFee' is the additional charge
     * Example: Restaurant bill 5000 + service fee 500 → amount: 5000, serviceFee: 500

Return JSON in this exact format:
{
  "bankName": "Name of the bank if found",
  "accountNumber": "Account number if found",
  "period": {
    "from": "YYYY-MM-DD",
    "to": "YYYY-MM-DD"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Transaction description",
      "amount": 9800.00,           // Main transaction amount (without fees)
      "type": "debit" or "credit",
      "category": "transportation", // Category VALUE from the list above
      "balance": 5680.04,           // Final balance after all fees
      "vat": 1.88,                  // VAT fee (if present)
      "serviceFee": 0,              // Service fee ON TOP of transaction (NOT for bank service charges themselves)
      "commission": 25.00,          // Commission fee (if present)
      "stampDuty": 0,               // Stamp duty (if present)
      "transferFee": 0,             // Transfer fee (if present)
      "processingFee": 0,           // Processing fee (if present)
      "otherFees": 0,               // Other fees (if present)
      "feeNote": "Optional explanation" // Explanation (if needed)
    },
    {
      "date": "YYYY-MM-DD",
      "description": "SMS ALERT CHARGE FOR AUG-SEP 2025",
      "amount": 192.00,            // THIS IS the service charge itself
      "type": "debit",
      "category": "communication",  // Categorized as communication expense
      "balance": 402.14,
      "vat": 14.40,                // VAT on the SMS charge
      "serviceFee": 0              // DO NOT duplicate - amount IS the service charge
    }
  ]
}

PRE-PROCESSED Bank Statement Text:
${statementText}

CRITICAL REMINDERS:
- This text has been CLEANED and GROUPED for you
- If you see "FEES:", "VAT:", "COMMISSION:", etc., these are ALREADY PART of the main transaction
- DO NOT create separate transaction entries for fees that appear on the same line as the main transaction
- The 'amount' field = main transaction amount ONLY (before fees)
- Extract fee breakdown fields from the pre-grouped data
- Use the BALANCE field for final balance (after all fees)
- Use "debit" for money going out, "credit" for money coming in
- **DO NOT duplicate service charges**: For SMS charges, account maintenance, monthly fees, etc., the amount IS the charge
- DO NOT DAYDREAM or MAKE UP data - only extract what is clearly present
`
}

/**
 * Validate and normalize LLM response
 */
function validateAndNormalizeLLMResponse(parsed: LLMParseResult): LLMParseResult {
  // Ensure required fields exist
  if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
    throw new Error('Invalid LLM response: transactions array missing')
  }

  // Normalize transactions
  const transactions: ParsedTransaction[] = parsed.transactions.map((t: ParsedTransaction) => {
    if (!t.date || !t.description || t.amount === undefined || !t.type) {
      console.warn('Skipping invalid transaction:', t)
      return null
    }

    // Calculate total fees
    const vat = t.vat ? Number(t.vat) : 0
    const serviceFee = t.serviceFee ? Number(t.serviceFee) : 0
    const commission = t.commission ? Number(t.commission) : 0
    const stampDuty = t.stampDuty ? Number(t.stampDuty) : 0
    const transferFee = t.transferFee ? Number(t.transferFee) : 0
    const processingFee = t.processingFee ? Number(t.processingFee) : 0
    const otherFees = t.otherFees ? Number(t.otherFees) : 0

    const totalFees = vat + serviceFee + commission + stampDuty + transferFee + processingFee + otherFees
    const amount = Number(t.amount)
    const total = amount + totalFees

    return {
      date: normalizeDate(t.date),
      description: String(t.description).trim(),
      amount,
      type: t.type === 'credit' ? 'credit' : 'debit',
      balance: t.balance ? Number(t.balance) : undefined,
      category: t.category ? String(t.category).trim() : undefined,
      // Fee breakdown fields
      vat: vat > 0 ? vat : undefined,
      serviceFee: serviceFee > 0 ? serviceFee : undefined,
      commission: commission > 0 ? commission : undefined,
      stampDuty: stampDuty > 0 ? stampDuty : undefined,
      transferFee: transferFee > 0 ? transferFee : undefined,
      processingFee: processingFee > 0 ? processingFee : undefined,
      otherFees: otherFees > 0 ? otherFees : undefined,
      feeNote: t.feeNote ? String(t.feeNote).trim() : undefined,
      // Total amount (amount + all fees)
      total: totalFees > 0 ? total : undefined,
    }
  }).filter(Boolean) as ParsedTransaction[]

  return {
    bankName: parsed.bankName || 'Unknown Bank',
    accountNumber: parsed.accountNumber,
    period: parsed.period
      ? {
          from: normalizeDate(parsed.period.from),
          to: normalizeDate(parsed.period.to),
        }
      : undefined,
    transactions,
  }
}

/**
 * Normalize date to ISO format
 */
function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) {
      throw new TypeError('Invalid date')
    }
    return date.toISOString().split('T')[0]
  }
  catch {
    console.warn('Failed to parse date:', dateStr)
    return new Date().toISOString().split('T')[0]
  }
}
