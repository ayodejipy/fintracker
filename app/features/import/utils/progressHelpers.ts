/**
 * Progress tracking utilities for import feature
 */

export interface ProcessingStep {
  label: string
  icon: string
  progress: number
}

/**
 * Define processing steps for visual feedback
 */
export const PROCESSING_STEPS: ProcessingStep[] = [
  { label: 'Upload', icon: 'i-heroicons-cloud-arrow-up', progress: 25 },
  { label: 'Extract', icon: 'i-heroicons-document-text', progress: 50 },
  { label: 'Analyze', icon: 'i-heroicons-sparkles', progress: 75 },
  { label: 'Complete', icon: 'i-heroicons-check-circle', progress: 100 },
]

/**
 * Get detailed status description based on progress
 */
export function getStatusDescription(progress: number): string {
  if (progress < 25) { return 'Preparing your file for upload...' }
  if (progress < 50) { return 'Uploading your bank statement to secure server...' }
  if (progress < 75) { return 'Extracting and analyzing transaction data...' }
  if (progress < 100) { return 'Categorizing and validating transactions...' }
  return 'Processing complete! Preparing results...'
}

/**
 * Get step styling class based on progress
 */
export function getStepClass(stepProgress: number, currentProgress: number): string {
  if (currentProgress >= stepProgress) {
    return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
  }
  return 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
}

/**
 * Get step icon class based on progress
 */
export function getStepIconClass(stepProgress: number, currentProgress: number): string {
  if (currentProgress >= stepProgress) {
    return 'text-blue-600 dark:text-blue-400'
  }
  return 'text-gray-400 dark:text-gray-600'
}

/**
 * Get step label class based on progress
 */
export function getStepLabelClass(stepProgress: number, currentProgress: number): string {
  if (currentProgress >= stepProgress) {
    return 'text-gray-900 dark:text-gray-100'
  }
  return 'text-gray-500 dark:text-gray-500'
}
