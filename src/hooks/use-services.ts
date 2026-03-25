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
    Promise.allSettled([fetchAllServices(), fetchGreenAreas(), fetchBusLines()])
      .then(([svcResult, greenResult, busResult]) => {
        if (svcResult.status === 'fulfilled') setServices(svcResult.value)
        if (greenResult.status === 'fulfilled') setGreenAreas(greenResult.value)
        if (busResult.status === 'fulfilled') setBusLines(busResult.value)
        if (
          svcResult.status === 'rejected' &&
          greenResult.status === 'rejected'
        ) {
          setError(new Error('Failed to fetch services'))
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { services, greenAreas, busLines, isLoading, error }
}
