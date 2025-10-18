/**
 * File utility functions for import feature
 */

/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

/**
 * Validate file type
 */
export function isValidPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Get file validation errors
 */
export function getFileValidationErrors(file: File): string[] {
  const errors: string[] = []

  if (!isValidPDFFile(file)) {
    errors.push('File must be a PDF')
  }

  if (!isValidFileSize(file, 10)) {
    errors.push('File size must be less than 10MB')
  }

  return errors
}
