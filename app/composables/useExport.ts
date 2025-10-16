import type { ExportOptions } from '~/schemas/export'
import { ExportService } from '~/utils/export'

export function useExport() {
  const { user } = useAuth()
  const { handleError } = useErrorHandler()

  const isExporting = ref(false)
  const exportProgress = ref(0)

  const isFormValid = (options: ExportOptions) => {
    if (options.dateRange === 'custom') {
      return options.startDate && options.endDate
    }
    return true
  }

  const startExport = async (options: ExportOptions) => {
    if (!isFormValid(options) || !user.value) {
      return { success: false, error: 'Invalid form data or user not authenticated' }
    }

    isExporting.value = true
    exportProgress.value = 0

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (exportProgress.value < 90) {
          exportProgress.value += Math.random() * 20
        }
      }, 200)

      const result = await ExportService.exportUserData(
        user.value.id,
        options.format,
        options.dataType,
      )

      clearInterval(progressInterval)
      exportProgress.value = 100

      if (result.success) {
        useToast().add({
          title: 'Export Complete',
          description: `Your ${options.dataType} data has been exported as ${options.format.toUpperCase()}`,
          color: 'green',
        })

        return { success: true }
      }
      else {
        throw new Error(result.error || 'Export failed')
      }
    }
    catch (error) {
      handleError(error, { exportOptions: options }, { showToast: true })
      return { success: false, error }
    }
    finally {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  return {
    isExporting: readonly(isExporting),
    exportProgress: readonly(exportProgress),
    isFormValid,
    startExport,
  }
}
