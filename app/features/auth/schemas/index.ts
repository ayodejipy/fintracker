// Re-export all schemas
// Profile update schema
import { z } from 'zod'

export * from './login'
export * from './register'

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  monthlyIncome: z.number().min(0, 'Monthly income must be a positive number'),
  currency: z.string().default('NGN'),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
