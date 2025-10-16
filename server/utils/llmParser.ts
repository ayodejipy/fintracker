import type { ParsedTransaction } from '../../app/types'
import { GoogleGenAI, Type } from "@google/genai";

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
export async function parseBankStatementWithLLM(text: string): Promise<LLMParseResult> {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
  }

  const prompt = buildParsingPrompt(text)
  const ai = new GoogleGenAI({})

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          includeThoughts: true,
        },
        responseMimeType: "application/json",
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
                    balance: { type: Type.NUMBER, nullable: true },
                  },
                  required: ['date', 'description', 'amount', 'type'],
                },
              },
            },
            propertyOrdering: ["bankName", "accountNumber", "period", "transactions"],
          },
        }
      }
    });

    console.log("LLM Response: ", response.text);

    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`)
    }

    const content = response.text

    if (!content) {
      throw new Error('No response from LLM')
    }

    const parsed = JSON.parse(content) as unknown as LLMParseResult[]

    // Validate and normalize the response
    return validateAndNormalizeLLMResponse(parsed[0])
  }
  catch (error) {
    console.error('LLM parsing error:', error)
    throw error
  }
}

/**
 * Build the prompt for LLM parsing
 */
function buildParsingPrompt(statementText: string): string {
  return `
As a finance expert, I need you to parse the following bank statement and extract ALL transactions in JSON format.

IMPORTANT INSTRUCTIONS:
1. Extract every single transaction from the statement
2. Identify if each transaction is a debit (money out) or credit (money in)
3. Parse dates in ISO format (YYYY-MM-DD)
4. Extract amounts as numbers (no currency symbols)
5. Include the original description exactly as it appears
6. Extract bank name, account number, and statement period if available

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
      "amount": 1000.00,
      "type": "debit" or "credit",
      "balance": 5000.00
    }
  ]
}

Bank Statement Text:
${statementText}

Remember to:
- Parse ALL transactions (don't skip any)
- Use "debit" for money going out (withdrawals, payments, transfers out)
- Use "credit" for money coming in (deposits, income, transfers in)
- Keep descriptions clean but complete
- Extract exact amounts
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

    return {
      date: normalizeDate(t.date),
      description: String(t.description).trim(),
      amount: Number(t.amount),
      type: t.type === 'credit' ? 'credit' : 'debit',
      balance: t.balance ? Number(t.balance) : undefined,
    }
  }).filter(Boolean) as ParsedTransaction[]

  return {
    bankName: parsed.bankName || 'Unknown Bank',
    accountNumber: parsed.accountNumber,
    period: parsed.period ? {
      from: normalizeDate(parsed.period.from),
      to: normalizeDate(parsed.period.to),
    } : undefined,
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
      throw new Error('Invalid date')
    }
    return date.toISOString().split('T')[0]
  }
  catch {
    console.warn('Failed to parse date:', dateStr)
    return new Date().toISOString().split('T')[0]
  }
}
