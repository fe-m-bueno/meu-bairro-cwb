'use client'

import { useMemo, useRef } from 'react'
import { cacheSet } from '@/lib/cache'
import { calculateAllScores } from '@/lib/score'
import type { BairroScore, CategoryKey } from '@/lib/types'
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

  // Track previous inputs to avoid recomputing when references are identical
  const prevInputsRef = useRef<{
    bairrosLen: number
    servicesKeys: string
    greenAreasLen: number
    busLinesLen: number
  }>({ bairrosLen: 0, servicesKeys: '', greenAreasLen: 0, busLinesLen: 0 })
  const prevScoresRef = useRef<BairroScore[]>([])

  const scores = useMemo(() => {
    if (bairros.length === 0 || Object.keys(services).length === 0) return []

    // Build a fingerprint from data lengths to detect actual changes
    const servicesKeys = Object.entries(services)
      .map(([k, v]) => `${k}:${v.length}`)
      .join(',')
    const inputs = {
      bairrosLen: bairros.length,
      servicesKeys,
      greenAreasLen: greenAreas.length,
      busLinesLen: busLines.length,
    }

    const prev = prevInputsRef.current
    if (
      prev.bairrosLen === inputs.bairrosLen &&
      prev.servicesKeys === inputs.servicesKeys &&
      prev.greenAreasLen === inputs.greenAreasLen &&
      prev.busLinesLen === inputs.busLinesLen &&
      prevScoresRef.current.length > 0
    ) {
      return prevScoresRef.current
    }

    const computed = calculateAllScores(bairros, services, greenAreas, busLines)
    cacheSet('scores', computed)
    prevInputsRef.current = inputs
    prevScoresRef.current = computed
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
