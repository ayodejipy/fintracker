import { extractTextFromPDFServer } from '../../utils/pdfExtractor'
import { readMultipartFormData } from 'h3'

/**
 * Extract text from uploaded PDF file
 * POST /api/statements/extract
 *
 * This endpoint handles PDF extraction on the server side to avoid
 * browser compatibility issues with PDF.js and canvas rendering
 */
export default defineEventHandler(async (event) => {
  try {
    // Read uploaded file from form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'NO_FILE',
        message: 'No file uploaded',
      })
    }

    // Get the PDF file
    const pdfFile = formData.find(item => item.name === 'file')

    if (!pdfFile?.data || !Buffer.isBuffer(pdfFile.data)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_FILE',
        message: 'Invalid file format',
      })
    }

    // Get optional password
    const passwordField = formData.find(item => item.name === 'password')
    const password = passwordField?.data?.toString('utf-8')

    // Extract text from PDF
    const extraction = await extractTextFromPDFServer(pdfFile.data, password)

    if (!extraction.success) {
      // Check if it's a password error
      if (extraction.requiresPassword) {
        // Distinguish between password required and incorrect password
        const statusMessage = extraction.isIncorrectPassword
          ? 'PASSWORD_INCORRECT'
          : 'PASSWORD_REQUIRED'

        throw createError({
          statusCode: 401,
          statusMessage,
          message: extraction.error || 'This PDF is password protected',
        })
      }

      // Other extraction errors
      throw createError({
        statusCode: 422,
        statusMessage: 'EXTRACTION_FAILED',
        message: extraction.error || 'Failed to extract text from PDF',
      })
    }

    return {
      success: true,
      text: extraction.text,
      message: 'PDF text extracted successfully',
    }
  } catch (error: any) {
    // Pass through existing errors
    if (error.statusCode) {
      throw error
    }

    // Handle unexpected errors
    console.error('Unexpected error in PDF extraction:', error)
    throw createError({
      statusCode: 500,
      message: 'An unexpected error occurred while extracting text from the PDF',
    })
  }
})
