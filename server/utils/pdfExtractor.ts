import { PDFParse } from 'pdf-parse'

/**
 * Extract text from PDF using pdf-parse on the server
 * This runs on the server side where all dependencies are available
 */
export async function extractTextFromPDFServer(
  pdfBuffer: Buffer,
  password?: string,
): Promise<{
  success: boolean
  text?: string
  error?: string
  requiresPassword?: boolean
  isIncorrectPassword?: boolean
}> {
  try {
    const options: { data: Buffer, password?: string } = { data: pdfBuffer }

    if (password) {
      options.password = password
    }

    const parser = new PDFParse(options)
    const result = await parser.getText()

    if (!result.text || result.text.trim().length === 0) {
      return {
        success: false,
        error: 'No text could be extracted from the PDF. It may be an image-based PDF.',
      }
    }

    return {
      success: true,
      text: result.text,
    }
  } catch (error: any) {
    console.error('PDF extraction error:', error)

    const errorMsg = error.message || ''
    const isPasswordError = errorMsg.includes('password') || errorMsg.includes('encrypted') || errorMsg.includes('No password given')
    const isIncorrectPassword = password && (errorMsg.includes('incorrect') || errorMsg.includes('invalid') || errorMsg.includes('wrong'))

    if (isPasswordError || isIncorrectPassword) {
      const errorMessage = isIncorrectPassword
        ? 'Incorrect password. Please try again.'
        : 'This PDF is password protected. Please provide the password.'

      return {
        success: false,
        error: errorMessage,
        requiresPassword: true,
        isIncorrectPassword, // Add flag to distinguish between no password and incorrect password
      }
    }

    const errorMessage = error.message || 'Failed to extract text from PDF'

    return {
      success: false,
      error: errorMessage,
    }
  }
}
