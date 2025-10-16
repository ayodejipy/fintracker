// Dynamic import for bcryptjs to avoid CommonJS issues
async function getBcrypt() {
  const bcrypt = await import('bcryptjs')
  return bcrypt.default || bcrypt
}

// Re-export schemas and types from the feature module
export {
  type LoginInput,
  loginSchema,
  type PersonalInfoInput,
  personalInfoSchema,
  type ProfileUpdateInput,
  profileUpdateSchema,
  type RegisterInput,
  registerSchema,
} from '~/features/auth/schemas'

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await getBcrypt()
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = await getBcrypt()
  return await bcrypt.compare(password, hashedPassword)
}

// User session utilities
export function sanitizeUser(user: unknown) {
  const { password: _password, ...sanitizedUser } = user
  return sanitizedUser
}

// Auth error types
export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_SESSION: 'INVALID_SESSION',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const
