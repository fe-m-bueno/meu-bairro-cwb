'use client'

import { useEffect, useState } from 'react'
import { fetchAllServices, fetchBusLines, fetchGreenAreas } from '@/lib/api'
import type { BusLine, GreenArea, ServiceFacility } from '@/lib/types'

export function useServices() {
  const [services, setServices] = useState<Record<string, ServiceFacility[]>>(
    {},
  )
  const [greenAreas, setGreenAreas] = useState<GreenArea[]>([])
  const [busLines, setBusLines] = useState<BusLine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      try {
        const [svcResult, greenResult, busResult] = await Promise.allSettled([
          fetchAllServices(signal),
          fetchGreenAreas(signal),
          fetchBusLines(signal),
        ])

        if (svcResult.status === 'fulfilled') setServices(svcResult.value)
        if (greenResult.status === 'fulfilled') setGreenAreas(greenResult.value)
        if (busResult.status === 'fulfilled') setBusLines(busResult.value)
      } catch (e) {
        if (!signal.aborted) {
          setError(
            e instanceof Error ? e : new Error('Failed to fetch services'),
          )
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [])

  return { services, greenAreas, busLines, isLoading, error }
}
