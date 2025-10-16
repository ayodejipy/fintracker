import type { PaginatedResponse, Transaction } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Query parameters validation schema
const GetTransactionsQuerySchema = z.object({
  month: z.string().optional(),
  category: z.enum([
    'loan_repayment',
    'home_allowance',
    'rent',
    'transport',
    'food',
    'data_airtime',
    'miscellaneous',
    'savings',
  ]).optional(),
  type: z.enum(['income', 'expense']).optional(),
  limit: z.string().transform(val => Number.parseInt(val, 10)).optional().default('50'),
  page: z.string().transform(val => Number.parseInt(val, 10)).optional().default('1'),
  search: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await getUserSession(event)
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Parse and validate query parameters
    const query = await getQuery(event)
    const validatedQuery = GetTransactionsQuerySchema.parse(query)

    const { month, category, type, limit, page, search } = validatedQuery
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    if (month) {
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (category) {
      where.category = category
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          category: true,
          description: true,
          date: true,
          type: true,
          createdAt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ])

    // Transform Prisma results to match our types
    const transformedTransactions: Omit<Transaction, 'userId'>[] = transactions.map(t => ({
      id: t.id,
      amount: Number(t.amount),
      category: t.category as any,
      description: t.description,
      date: t.date,
      type: t.type as 'income' | 'expense',
      createdAt: t.createdAt,
    }))

    const response: PaginatedResponse<Omit<Transaction, 'userId'>> = {
      data: transformedTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    return response
  }
  catch (error) {
    console.error('Error fetching transactions:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions',
    })
  }
})
