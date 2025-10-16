export interface User {
  id: string
  email: string
  name: string
  monthlyIncome: number
  currency: 'NGN'
  createdAt: Date
  updatedAt: Date
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  monthlyIncome: number
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: Date
}
