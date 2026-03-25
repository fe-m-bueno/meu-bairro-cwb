'use client'

import { useEffect, useState } from 'react'
import { fetchBairros } from '@/lib/api'
import type { Bairro } from '@/lib/types'

export function useBairros() {
  const [bairros, setBairros] = useState<Bairro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchBairros()
      .then(setBairros)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { bairros, isLoading, error }
}
