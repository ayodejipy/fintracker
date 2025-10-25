/**
 * Bank Field Mappings
 *
 * Maps bank-specific column names to standardized field names.
 * This allows us to normalize different bank statement formats
 * without complex parsing logic.
 *
 * When adding a new bank:
 * 1. Add a new entry to BANK_FIELD_MAPPINGS
 * 2. Map their specific column names to our standard fields
 * 3. Add any bank-specific patterns to BANK_PATTERNS
 */

/**
 * Standard fields we expect from all bank statements
 */
export interface StandardFields {
  transactionDate: string // When transaction was initiated
  valueDate: string // When transaction was settled
  description: string // Transaction details/remarks
  debit: string // Money out
  credit: string // Money in
  balance: string // Account balance after transaction
  reference?: string // Transaction reference (optional, may be embedded)
  branch?: string // Branch info (optional)
}

/**
 * Bank-specific column name mappings
 * Key: Bank identifier
 * Value: Mapping of their column names to standard field names
 */
export const BANK_FIELD_MAPPINGS: Record<string, Record<string, keyof StandardFields>> = {
  // First Bank mappings
  firstbank: {
    'TXN DATE': 'transactionDate',
    'TRANSACTION DATE': 'transactionDate',
    'VAL DATE': 'valueDate',
    'VALUE DATE': 'valueDate',
    'REMARKS': 'description',
    'DESCRIPTION': 'description',
    'DEBIT': 'debit',
    'CREDIT': 'credit',
    'BALANCE': 'balance',
  },

  // GTBank mappings
  gtbank: {
    'TRANS. DATE': 'transactionDate',
    'TRANS DATE': 'transactionDate',
    'TRANSACTION DATE': 'transactionDate',
    'VALUE DATE': 'valueDate',
    'REMARKS': 'description',
    'DESCRIPTION': 'description',
    'DEBITS': 'debit',
    'DEBIT': 'debit',
    'CREDITS': 'credit',
    'CREDIT': 'credit',
    'BALANCE': 'balance',
    'REFERENCE': 'reference',
    'REF': 'reference',
    'ORIGINATING BRANCH': 'branch',
    'BRANCH': 'branch',
  },

  // Access Bank mappings
  accessbank: {
    'TRANSACTION DATE': 'transactionDate',
    'TXN DATE': 'transactionDate',
    'VALUE DATE': 'valueDate',
    'NARRATION': 'description',
    'DESCRIPTION': 'description',
    'REMARKS': 'description',
    'DEBIT': 'debit',
    'CREDIT': 'credit',
    'BALANCE': 'balance',
    'REFERENCE': 'reference',
  },

  // Zenith Bank mappings
  zenithbank: {
    'TRANSACTION DATE': 'transactionDate',
    'TXN DATE': 'transactionDate',
    'VALUE DATE': 'valueDate',
    'VAL DATE': 'valueDate',
    'NARRATION': 'description',
    'REMARKS': 'description',
    'DESCRIPTION': 'description',
    'DEBIT': 'debit',
    'CREDIT': 'credit',
    'BALANCE': 'balance',
    'RUNNING BALANCE': 'balance',
    'REFERENCE': 'reference',
  },

  // UBA mappings
  uba: {
    'TRANSACTION DATE': 'transactionDate',
    'TXN DATE': 'transactionDate',
    'VALUE DATE': 'valueDate',
    'VAL DATE': 'valueDate',
    'NARRATION': 'description',
    'DESCRIPTION': 'description',
    'DEBIT': 'debit',
    'CREDIT': 'credit',
    'BALANCE': 'balance',
    'REFERENCE': 'reference',
  },

  // Generic fallback (catches common variations)
  generic: {
    'DATE': 'transactionDate',
    'TRANSACTION DATE': 'transactionDate',
    'TXN DATE': 'transactionDate',
    'TRANS DATE': 'transactionDate',
    'VALUE DATE': 'valueDate',
    'VAL DATE': 'valueDate',
    'DESCRIPTION': 'description',
    'REMARKS': 'description',
    'NARRATION': 'description',
    'DETAILS': 'description',
    'PARTICULARS': 'description',
    'DEBIT': 'debit',
    'DEBITS': 'debit',
    'WITHDRAWAL': 'debit',
    'CREDIT': 'credit',
    'CREDITS': 'credit',
    'DEPOSIT': 'credit',
    'BALANCE': 'balance',
    'RUNNING BALANCE': 'balance',
    'CLOSING BALANCE': 'balance',
    'REFERENCE': 'reference',
    'REF': 'reference',
    'REF NO': 'reference',
    'BRANCH': 'branch',
  },
}

/**
 * Patterns to identify fee/charge transactions
 * These help group related transactions (main transaction + fees)
 */
export const FEE_KEYWORDS = [
  'COMMISSION',
  'VAT',
  'VATCHARGES',
  'STAMP DUTY',
  'LEVY',
  'CHARGE',
  'CHARGES',
  'FEE',
  'FEES',
  'SMS CHARGE',
  'SMS ALERT',
  'PROCESSING FEE',
  'SERVICE CHARGE',
  'TRANSFER FEE',
  'TRANSFER CHARGE',
  'ELECTRONIC MONEY TRANSFER LEVY',
  'COT', // Commission on Turnover
  'CARD MAINTENANCE',
]

/**
 * Patterns to identify transaction types
 * Used for basic categorization before LLM processing
 */
export const TRANSACTION_TYPE_PATTERNS = {
  transfer: [
    'TRANSFER',
    'NIP',
    'NIBSS',
    'OUTWARD',
    'INWARD',
    'SEND',
    'RECEIVE',
  ],
  airtime: [
    'AIRTIME',
    'RECHARGE',
    'MTN',
    'AIRTEL',
    'GLO',
    'ETISALAT',
    '9MOBILE',
  ],
  data: [
    'DATA',
    'INTERNET',
  ],
  withdrawal: [
    'ATM',
    'WITHDRAWAL',
    'CASH WITHDRAWAL',
    'POS WITHDRAWAL',
  ],
  purchase: [
    'POS',
    'PURCHASE',
    'PAYMENT',
    'WEB PURCHASE',
  ],
  bill: [
    'BILL PAYMENT',
    'UTILITY',
    'ELECTRICITY',
    'NEPA',
    'DSTV',
    'GOTV',
    'SHOWMAX',
  ],
}

/**
 * Bank-specific patterns for detection
 * Used to auto-detect bank type from statement
 */
export const BANK_DETECTION_PATTERNS: Record<string, string[]> = {
  firstbank: [
    'FIRST BANK',
    'FBN',
    'ACCOUNT TRANSFERS MOB:',
    'OUTWARD TRANSFER (N) MOB:',
  ],
  gtbank: [
    'GTBANK',
    'GUARANTY TRUST BANK',
    'GTB',
    'NIBSS INSTANT PAYMENT',
    'ORIGINATING BRANCH',
  ],
  accessbank: [
    'ACCESS BANK',
    'ACCESSBANK',
  ],
  zenithbank: [
    'ZENITH BANK',
    'ZENITHBANK',
  ],
  uba: [
    'UNITED BANK',
    'UBA',
  ],
}

/**
 * Symbols to remove during cleanup
 * Basic cleanup without destroying information
 */
export const CLEANUP_SYMBOLS = [
  // Duplicate/excessive delimiters
  /\|{2,}/g, // Multiple pipes
  /-{2,}/g, // Multiple dashes
  /={2,}/g, // Multiple equals
  /_{2,}/g, // Multiple underscores

  // Excessive whitespace (but preserve structure)
  /[ \t]{3,}/g, // 3+ spaces/tabs → single space

  // Common noise characters (careful not to remove meaningful ones)
  /[*#~`]/g, // These are rarely meaningful in statements
]

/**
 * Get field mapping for a specific bank
 */
export function getFieldMapping(bankType: string): Record<string, keyof StandardFields> {
  const mapping = BANK_FIELD_MAPPINGS[bankType.toLowerCase()]
  if (!mapping) {
    console.warn(`No mapping found for bank type: ${bankType}, using generic`)
    return BANK_FIELD_MAPPINGS.generic
  }
  return mapping
}

/**
 * Check if a description indicates a fee/charge transaction
 */
export function isFeeTransaction(description: string): boolean {
  const upperDesc = description.toUpperCase()
  return FEE_KEYWORDS.some(keyword => upperDesc.includes(keyword))
}

/**
 * Detect basic transaction type from description
 * Returns null if type cannot be determined (LLM will handle it)
 */
export function detectTransactionType(description: string): string | null {
  const upperDesc = description.toUpperCase()

  for (const [type, patterns] of Object.entries(TRANSACTION_TYPE_PATTERNS)) {
    if (patterns.some(pattern => upperDesc.includes(pattern))) {
      return type
    }
  }

  return null // Let LLM categorize
}

/**
 * Auto-detect bank type from raw text
 */
export function detectBankFromText(text: string): string {
  const upperText = text.toUpperCase()

  for (const [bank, patterns] of Object.entries(BANK_DETECTION_PATTERNS)) {
    if (patterns.some(pattern => upperText.includes(pattern))) {
      return bank
    }
  }

  return 'generic'
}

/**
 * Basic cleanup of description text
 * Removes symbols but preserves meaningful information
 */
export function cleanDescription(description: string): string {
  let cleaned = description

  // Apply symbol cleanup
  for (const pattern of CLEANUP_SYMBOLS) {
    if (pattern instanceof RegExp) {
      cleaned = cleaned.replace(pattern, ' ')
    }
  }

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return cleaned
}
