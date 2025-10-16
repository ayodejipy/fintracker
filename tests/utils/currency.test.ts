import { describe, expect, it } from 'vitest'
import {
  amountToWords,
  formatCurrency,
  formatCurrencyCompact,
  formatNigerianDate,
  formatNigerianNumber,
  getCurrencyDetails,
  getNigerianExpenseCategories,
  getSupportedCurrencies,
  parseCurrency,
} from '../../app/utils/currency'

describe('currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format NGN currency correctly', () => {
      expect(formatCurrency(1000, 'NGN')).toMatch(/₦.*1,000\.00/)
    })

    it('should format USD currency correctly', () => {
      expect(formatCurrency(1000, 'USD')).toMatch(/\$.*1,000\.00/)
    })

    it('should format EUR currency correctly', () => {
      expect(formatCurrency(1000, 'EUR')).toMatch(/€.*1,000\.00/)
    })

    it('should format GBP currency correctly', () => {
      expect(formatCurrency(1000, 'GBP')).toMatch(/£.*1,000\.00/)
    })

    it('should default to NGN when no currency specified', () => {
      expect(formatCurrency(1000)).toMatch(/₦.*1,000\.00/)
    })
  })

  describe('formatCurrencyCompact', () => {
    it('should format large amounts compactly', () => {
      expect(formatCurrencyCompact(1500000, 'NGN')).toMatch(/₦.*1\.5M/)
    })

    it('should format thousands compactly', () => {
      expect(formatCurrencyCompact(1500, 'NGN')).toMatch(/₦.*1\.5K/)
    })
  })

  describe('parseCurrency', () => {
    it('should parse NGN currency string', () => {
      expect(parseCurrency('₦1,000.00')).toBe(1000)
    })

    it('should parse USD currency string', () => {
      expect(parseCurrency('$1,000.00')).toBe(1000)
    })

    it('should parse currency string with spaces', () => {
      expect(parseCurrency('₦ 1,000.00')).toBe(1000)
    })

    it('should handle decimal values', () => {
      expect(parseCurrency('₦1,234.56')).toBe(1234.56)
    })
  })

  describe('getCurrencyDetails', () => {
    it('should return correct details for NGN', () => {
      const details = getCurrencyDetails('NGN')
      expect(details.code).toBe('NGN')
      expect(details.name).toBe('Nigerian Naira')
      expect(details.symbol).toBe('₦')
      expect(details.primary).toBe(true)
    })

    it('should return correct details for USD', () => {
      const details = getCurrencyDetails('USD')
      expect(details.code).toBe('USD')
      expect(details.name).toBe('US Dollar')
      expect(details.symbol).toBe('$')
      expect(details.primary).toBe(false)
    })
  })

  describe('getSupportedCurrencies', () => {
    it('should return all supported currencies', () => {
      const currencies = getSupportedCurrencies()
      expect(currencies).toHaveLength(4)
      expect(currencies.map(c => c.code)).toEqual(['NGN', 'USD', 'EUR', 'GBP'])
    })

    it('should have NGN as primary currency', () => {
      const currencies = getSupportedCurrencies()
      const ngn = currencies.find(c => c.code === 'NGN')
      expect(ngn?.primary).toBe(true)
    })
  })

  describe('getNigerianExpenseCategories', () => {
    it('should return Nigerian expense categories', () => {
      const categories = getNigerianExpenseCategories()
      expect(categories.length).toBeGreaterThan(0)

      // Check for some expected categories
      const categoryIds = categories.map(c => c.id)
      expect(categoryIds).toContain('food')
      expect(categoryIds).toContain('transportation')
      expect(categoryIds).toContain('housing')
      expect(categoryIds).toContain('family')
    })

    it('should have proper structure for each category', () => {
      const categories = getNigerianExpenseCategories()
      const firstCategory = categories[0]

      expect(firstCategory).toHaveProperty('id')
      expect(firstCategory).toHaveProperty('name')
      expect(firstCategory).toHaveProperty('icon')
      expect(firstCategory).toHaveProperty('subcategories')
      expect(Array.isArray(firstCategory.subcategories)).toBe(true)
    })
  })

  describe('formatNigerianDate', () => {
    it('should format date in Nigerian format', () => {
      const date = new Date('2024-01-15')
      const formatted = formatNigerianDate(date)
      expect(formatted).toContain('Monday')
      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should handle string dates', () => {
      const formatted = formatNigerianDate('2024-01-15')
      expect(formatted).toContain('Monday')
      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })
  })

  describe('formatNigerianNumber', () => {
    it('should format numbers with Nigerian locale', () => {
      expect(formatNigerianNumber(1000)).toBe('1,000')
      expect(formatNigerianNumber(1000000)).toBe('1,000,000')
    })
  })

  describe('amountToWords', () => {
    it('should convert zero to words', () => {
      expect(amountToWords(0)).toBe('Zero Nigerian Naira')
    })

    it('should convert thousands to words', () => {
      const result = amountToWords(5000)
      expect(result).toContain('5 Thousand Nigerian Naira')
    })

    it('should convert millions to words', () => {
      const result = amountToWords(2500000)
      expect(result).toContain('2.5 Million Nigerian Naira')
    })

    it('should work with different currencies', () => {
      const result = amountToWords(1000, 'USD')
      expect(result).toContain('1 Thousand US Dollar')
    })
  })
})

describe('currency Integration', () => {
  it('should maintain consistency between format and parse', () => {
    const originalAmount = 1234.56
    const formatted = formatCurrency(originalAmount, 'NGN')
    const parsed = parseCurrency(formatted)
    expect(parsed).toBe(originalAmount)
  })

  it('should handle edge cases', () => {
    expect(formatCurrency(0)).toMatch(/₦.*0\.00/)
    expect(parseCurrency('₦0.00')).toBe(0)
    expect(formatCurrency(-100)).toMatch(/-₦.*100\.00/)
  })
})
