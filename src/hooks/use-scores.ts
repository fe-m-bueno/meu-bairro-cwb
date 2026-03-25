'use client'

import { useMemo } from 'react'
import { cacheSet } from '@/lib/cache'
import { calculateAllScores } from '@/lib/score'
import type { CategoryKey } from '@/lib/types'
import { useBairros } from './use-bairros'
import { useServices } from './use-services'

export function useScores() {
  const {
    bairros,
    isLoading: bairrosLoading,
    error: bairrosError,
  } = useBairros()
  const {
    services,
    greenAreas,
    busLines,
    isLoading: servicesLoading,
    error: servicesError,
  } = useServices()

  const isLoading = bairrosLoading || servicesLoading
  const error = bairrosError || servicesError

  const scores = useMemo(() => {
    if (bairros.length === 0 || Object.keys(services).length === 0) return []
    const computed = calculateAllScores(bairros, services, greenAreas, busLines)
    cacheSet('scores', computed)
    return computed
  }, [bairros, services, greenAreas, busLines])

  const cityAverage = useMemo(() => {
    if (scores.length === 0) return null
    const keys: CategoryKey[] = [
      'saude',
      'educacao',
      'seguranca',
      'transporte',
      'areasVerdes',
      'cultura',
      'diversidade',
    ]
    const avg: Record<string, number> = {}
    for (const key of keys) {
      avg[key] = Math.round(
        scores.reduce((s, sc) => s + sc.categories[key].score, 0) /
          scores.length,
      )
    }
    avg.overall = Math.round(
      scores.reduce((s, sc) => s + sc.overall, 0) / scores.length,
    )
    return avg
  }, [scores])

  return { scores, cityAverage, bairros, services, isLoading, error }
}
