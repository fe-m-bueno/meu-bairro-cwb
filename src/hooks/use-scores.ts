'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cacheGet, cacheSet } from '@/lib/cache'
import { fetchCrimeData } from '@/lib/api/crime-data'
import { calculateAllScores } from '@/lib/score'
import type { BairroCrimeData, BairroScore, CategoryKey } from '@/lib/types'
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

  const [crimeData, setCrimeData] = useState<BairroCrimeData[]>([])
  const [crimeLoading, setCrimeLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchCrimeData().then((data) => {
      if (!cancelled) {
        setCrimeData(data)
        setCrimeLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const isLoading = bairrosLoading || servicesLoading || crimeLoading
  const error = bairrosError || servicesError

  const prevFingerprintRef = useRef('')
  const prevScoresRef = useRef<BairroScore[]>([])

  const scores = useMemo(() => {
    // CRITICAL: Wait for ALL data to load before computing scores.
    // Computing with partial data (empty greenAreas/busLines) produces
    // wrong scores that get cached and persist across navigation.
    if (isLoading) return prevScoresRef.current
    if (bairros.length === 0 || Object.keys(services).length === 0) return []

    // Build fingerprint that includes ALL data sources
    const fingerprint = [
      `b:${bairros.length}`,
      ...Object.entries(services).map(([k, v]) => `${k}:${v.length}`),
      `g:${greenAreas.length}`,
      `l:${busLines.length}`,
      `c:${crimeData.length}`,
    ].join('|')

    // Skip recomputation if fingerprint unchanged
    if (
      fingerprint === prevFingerprintRef.current &&
      prevScoresRef.current.length > 0
    ) {
      return prevScoresRef.current
    }

    // Try localStorage cache with fingerprint validation
    const cacheKey = `scores:${fingerprint}`
    const cached = cacheGet<BairroScore[]>(cacheKey)
    if (cached && cached.length === bairros.length) {
      prevFingerprintRef.current = fingerprint
      prevScoresRef.current = cached
      return cached
    }

    const computed = calculateAllScores(
      bairros,
      services,
      greenAreas,
      busLines,
      crimeData.length > 0 ? crimeData : undefined,
    )
    cacheSet(cacheKey, computed)
    // Also save under generic key for quick navigation reads
    cacheSet('scores', computed)
    prevFingerprintRef.current = fingerprint
    prevScoresRef.current = computed
    return computed
  }, [bairros, services, greenAreas, busLines, crimeData, isLoading])

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
