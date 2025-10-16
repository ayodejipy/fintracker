import type { ApiResponse } from '@/types'

export function useApi() {
  const apiCall = async <T>(
    endpoint: string,
    options: any = {},
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await $fetch<ApiResponse<T>>(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      return response
    }
    catch (error) {
      console.error('API call failed:', error)
      throw error
    }
  }

  const get = <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'GET' })
  }

  const post = <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  const put = <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  const del = <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiCall<T>(endpoint, { method: 'DELETE' })
  }

  return {
    get,
    post,
    put,
    delete: del,
  }
}
