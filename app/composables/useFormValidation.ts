import { computed, reactive } from 'vue'
import { z } from 'zod'
import { validateFormData } from '~/utils/validation'
import { useErrorHandler } from './useErrorHandler'

export interface FormField {
  value: any
  error?: string
  touched: boolean
  dirty: boolean
}

export interface FormState<T> {
  fields: Record<keyof T, FormField>
  isValid: boolean
  isSubmitting: boolean
  hasErrors: boolean
  isDirty: boolean
  isTouched: boolean
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  schema: z.ZodSchema<T>,
) {
  const { handleError, validateForm: _validateForm } = useErrorHandler()

  // Create reactive form state
  const formState = reactive<FormState<T>>({
    fields: {} as Record<keyof T, FormField>,
    isValid: false,
    isSubmitting: false,
    hasErrors: false,
    isDirty: false,
    isTouched: false,
  })

  // Initialize form fields
  const initializeFields = () => {
    Object.keys(initialData).forEach((key) => {
      formState.fields[key as keyof T] = {
        value: initialData[key],
        error: undefined,
        touched: false,
        dirty: false,
      }
    })
  }

  initializeFields()

  // Computed properties
  const formData = computed(() => {
    const data = {} as T
    Object.keys(formState.fields).forEach((key) => {
      data[key as keyof T] = formState.fields[key as keyof T].value
    })
    return data
  })

  const errors = computed(() => {
    const errorObj = {} as Record<keyof T, string>
    Object.keys(formState.fields).forEach((key) => {
      const field = formState.fields[key as keyof T]
      if (field.error) {
        errorObj[key as keyof T] = field.error
      }
    })
    return errorObj
  })

  const touchedFields = computed(() => {
    return Object.keys(formState.fields).filter(
      key => formState.fields[key as keyof T].touched,
    )
  })

  const dirtyFields = computed(() => {
    return Object.keys(formState.fields).filter(
      key => formState.fields[key as keyof T].dirty,
    )
  })

  // Update computed states
  const updateFormState = () => {
    formState.hasErrors = Object.values(formState.fields).some(field => !!field.error)
    formState.isDirty = Object.values(formState.fields).some(field => field.dirty)
    formState.isTouched = Object.values(formState.fields).some(field => field.touched)

    // Validate entire form
    const validation = validateFormData(formData.value, schema)
    formState.isValid = validation.isValid && !formState.hasErrors
  }

  // Field manipulation methods
  const setFieldValue = (field: keyof T, value: any) => {
    const fieldState = formState.fields[field]
    if (fieldState) {
      fieldState.value = value
      fieldState.dirty = value !== initialData[field]
      updateFormState()
    }
  }

  const setFieldError = (field: keyof T, error?: string) => {
    const fieldState = formState.fields[field]
    if (fieldState) {
      fieldState.error = error
      updateFormState()
    }
  }

  const touchField = (field: keyof T) => {
    const fieldState = formState.fields[field]
    if (fieldState) {
      fieldState.touched = true
      updateFormState()
    }
  }

  const validateField = (field: keyof T) => {
    const fieldState = formState.fields[field]
    if (!fieldState) { return }

    try {
      // Create a partial schema for single field validation
      const fieldSchema = schema.pick({ [field]: true } as any)
      const fieldData = { [field]: fieldState.value } as Partial<T>

      fieldSchema.parse(fieldData)
      setFieldError(field, undefined)
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path.includes(field as string))
        setFieldError(field, fieldError?.message)
      }
    }
  }

  const validateAllFields = () => {
    const validation = validateFormData(formData.value, schema)

    // Clear all field errors first
    Object.keys(formState.fields).forEach((key) => {
      setFieldError(key as keyof T, undefined)
    })

    // Set new errors
    if (!validation.isValid && validation.errors) {
      Object.entries(validation.errors).forEach(([field, error]) => {
        setFieldError(field as keyof T, error)
      })
    }

    updateFormState()
    return validation.isValid
  }

  // Form submission
  const handleSubmit = async (
    onSubmit: (data: T) => Promise<void> | void,
    options?: {
      validateBeforeSubmit?: boolean
      showErrorToast?: boolean
    },
  ) => {
    const { validateBeforeSubmit = true, showErrorToast = true } = options || {}

    if (formState.isSubmitting) { return }

    formState.isSubmitting = true

    try {
      // Mark all fields as touched
      Object.keys(formState.fields).forEach((key) => {
        touchField(key as keyof T)
      })

      // Validate if requested
      if (validateBeforeSubmit && !validateAllFields()) {
        throw new Error('Form validation failed')
      }

      // Submit form
      await onSubmit(formData.value)

      // Reset dirty state on successful submission
      Object.keys(formState.fields).forEach((key) => {
        formState.fields[key as keyof T].dirty = false
      })
      updateFormState()
    }
    catch (error) {
      handleError(error, { formData: formData.value }, {
        showToast: showErrorToast,
      })
    }
    finally {
      formState.isSubmitting = false
    }
  }

  // Reset form
  const resetForm = (newData?: Partial<T>) => {
    const dataToUse = { ...initialData, ...newData }

    Object.keys(formState.fields).forEach((key) => {
      const field = formState.fields[key as keyof T]
      field.value = dataToUse[key as keyof T]
      field.error = undefined
      field.touched = false
      field.dirty = false
    })

    formState.isSubmitting = false
    updateFormState()
  }

  // Clear errors
  const clearErrors = () => {
    Object.keys(formState.fields).forEach((key) => {
      setFieldError(key as keyof T, undefined)
    })
  }

  // Set multiple errors (useful for server-side validation errors)
  const setErrors = (errors: Record<string, string>) => {
    Object.entries(errors).forEach(([field, error]) => {
      setFieldError(field as keyof T, error)
    })
  }

  // Field helpers for v-model binding
  const getFieldProps = (field: keyof T) => {
    return {
      'modelValue': formState.fields[field]?.value,
      'onUpdate:modelValue': (value: any) => setFieldValue(field, value),
      'onBlur': () => {
        touchField(field)
        validateField(field)
      },
      'error': formState.fields[field]?.error,
      'touched': formState.fields[field]?.touched,
      'dirty': formState.fields[field]?.dirty,
    }
  }

  // Debounced validation
  const debouncedValidateField = debounce((field: keyof T) => {
    validateField(field)
  }, 300)

  const getFieldPropsWithDebounce = (field: keyof T) => {
    return {
      ...getFieldProps(field),
      onInput: () => debouncedValidateField(field),
    }
  }

  return {
    // State
    formState: readonly(formState),
    formData,
    errors,
    touchedFields,
    dirtyFields,

    // Methods
    setFieldValue,
    setFieldError,
    touchField,
    validateField,
    validateAllFields,
    handleSubmit,
    resetForm,
    clearErrors,
    setErrors,
    getFieldProps,
    getFieldPropsWithDebounce,
  }
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) { clearTimeout(timeout) }
    timeout = setTimeout(() => func(...args), wait)
  }
}
