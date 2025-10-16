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
  locale: z.string().optional(),
})

// Type exports
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>
export type ThemePreferencesInput = z.infer<typeof themePreferencesSchema>
export type CurrencyPreferencesInput = z.infer<typeof currencyPreferencesSchema>

// Settings constants
export const SUPPORTED_CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
]

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'i-heroicons-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-heroicons-moon' },
  { value: 'system', label: 'System', icon: 'i-heroicons-computer-desktop' },
]
