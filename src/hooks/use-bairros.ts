'use client'

import { useEffect, useState } from 'react'
import { fetchBairros } from '@/lib/api'
import type { Bairro } from '@/lib/types'

export function useBairros() {
  const [bairros, setBairros] = useState<Bairro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    fetchBairros(signal)
      .then((data) => {
        if (!signal.aborted) setBairros(data)
      })
      .catch((e) => {
        if (!signal.aborted) setError(e)
      })
      .finally(() => {
        if (!signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { bairros, isLoading, error }
}
