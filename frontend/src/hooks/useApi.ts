import { useState, useCallback } from 'react'
import { AxiosError } from 'axios'

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (apiCall: () => Promise<{ data: T }>) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiCall()
      setData(response.data)
      return response.data
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>
      const msg = axiosErr.response?.data?.detail || axiosErr.message || 'Unknown error'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, execute }
}
