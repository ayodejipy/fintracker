import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  monthlyIncome: z.number().min(0, 'Monthly income must be a positive number'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
})

// Multi-step registration schemas
export const personalInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
})

export const incomeSchema = z.object({
  monthlyIncome: z.number().min(1, 'Please select an income range'),
})

export const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type IncomeInput = z.infer<typeof incomeSchema>
export type PasswordInput = z.infer<typeof passwordSchema>
