import { z } from 'zod'

// Profile settings schema
export const profileSettingsSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
  }).min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string({
    required_error: 'Email is required',
  }).email('Please enter a valid email address'),
  avatar: z.string().optional(),
})

// Security settings schema
export const securitySettingsSchema = z.object({
  currentPassword: z.string({
    required_error: 'Current password is required',
  }).min(1, 'Current password is required'),
  newPassword: z.string({
    required_error: 'New password is required',
  }).min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string({
    required_error: 'Please confirm your password',
  }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
})

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  email: z.object({
    budgetAlerts: z.boolean().default(true),
    goalReminders: z.boolean().default(true),
    weeklyReports: z.boolean().default(false),
    monthlyReports: z.boolean().default(true),
    securityAlerts: z.boolean().default(true),
  }),
  push: z.object({
    budgetAlerts: z.boolean().default(false),
    goalReminders: z.boolean().default(false),
    weeklyReports: z.boolean().default(false),
    monthlyReports: z.boolean().default(false),
    securityAlerts: z.boolean().default(true),
  }),
})

// Theme preferences schema
export const themePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  compactMode: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
})

// Currency preferences schema
export const currencyPreferencesSchema = z.object({
  currency: z.string({
    required_error: 'Currency is required',
  }).min(3, 'Currency code must be 3 characters').max(3, 'Currency code must be 3 characters'),
  locale: z.string().min(2, 'Locale is required'),
})

// Type exports
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>
export type ThemePreferencesInput = z.infer<typeof themePreferencesSchema>
export type CurrencyPreferencesInput = z.infer<typeof currencyPreferencesSchema>

// Enhanced currency options with flags and regions
export const CURRENCY_OPTIONS = [
  { value: 'NGN', label: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { value: 'USD', label: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { value: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
  { value: 'GBP', label: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { value: 'CHF', label: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { value: 'CNY', label: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
]

// Locale options for number formatting
export const LOCALE_OPTIONS = [
  { value: 'en-NG', label: 'English (Nigeria)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'en-CA', label: 'English (Canada)' },
  { value: 'en-AU', label: 'English (Australia)' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'it-IT', label: 'Italian (Italy)' },
  { value: 'ja-JP', label: 'Japanese (Japan)' },
  { value: 'zh-CN', label: 'Chinese (China)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ru-RU', label: 'Russian (Russia)' },
  { value: 'ar-SA', label: 'Arabic (Saudi Arabia)' },
]

// Theme options with enhanced metadata
export const THEME_OPTIONS = [
  {
    value: 'light' as const,
    label: 'Light',
    icon: 'i-heroicons-sun',
    description: 'Clean and bright interface',
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    icon: 'i-heroicons-moon',
    description: 'Easy on the eyes in low light',
  },
  {
    value: 'system' as const,
    label: 'System',
    icon: 'i-heroicons-computer-desktop',
    description: 'Follows your device preference',
  },
]

// Export validation functions
export function validateProfileSettings(data: unknown) {
  return profileSettingsSchema.parse(data)
}

export function validateSecuritySettings(data: unknown) {
  return securitySettingsSchema.parse(data)
}

export function validateNotificationPreferences(data: unknown) {
  return notificationPreferencesSchema.parse(data)
}

export function validateThemePreferences(data: unknown) {
  return themePreferencesSchema.parse(data)
}

export function validateCurrencyPreferences(data: unknown) {
  return currencyPreferencesSchema.parse(data)
}
