import { z } from 'zod'

// System metrics schema
export const systemMetricsSchema = z.object({
  cpu: z.object({
    usage: z.number(),
  }).optional(),
  memory: z.object({
    current: z.object({
      heapUsed: z.string(),
      heapTotal: z.string(),
    }),
  }).optional(),
  eventLoop: z.object({
    lag: z.number(),
    status: z.enum(['ok', 'warning']),
  }).optional(),
})

// Performance metrics schema
export const performanceMetricsSchema = z.object({
  api: z.object({
    avg: z.number(),
    p95: z.number(),
    count: z.number(),
    thresholdViolations: z.number(),
  }).optional(),
  database: z.object({
    avg: z.number(),
    p95: z.number(),
    count: z.number(),
    thresholdViolations: z.number(),
  }).optional(),
})

// Cache stats schema
export const cacheStatsSchema = z.object({
  dashboard: z.object({
    hitRate: z.number(),
    size: z.number(),
    hits: z.number(),
    misses: z.number(),
  }).optional(),
  transactions: z.object({
    hitRate: z.number(),
    size: z.number(),
    hits: z.number(),
    misses: z.number(),
  }).optional(),
  budgets: z.object({
    hitRate: z.number(),
    size: z.number(),
    hits: z.number(),
    misses: z.number(),
  }).optional(),
  calculations: z.object({
    hitRate: z.number(),
    size: z.number(),
    hits: z.number(),
    misses: z.number(),
  }).optional(),
})

// Type exports
export type SystemMetrics = z.infer<typeof systemMetricsSchema>
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>
export type CacheStats = z.infer<typeof cacheStatsSchema>
