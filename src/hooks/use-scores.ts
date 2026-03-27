'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchCrimeData } from '@/lib/api/crime-data'
import { cacheGet, cacheSet } from '@/lib/cache'
import { calculateAllScoresAsync } from '@/lib/score'
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
  const [scores, setScores] = useState<BairroScore[]>([])
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchCrimeData()
      .then((data) => {
        if (!cancelled) {
          setCrimeData(data)
        }
      })
      .catch(() => {
        // Crime data is non-blocking; scores compute without it
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isLoading = bairrosLoading || servicesLoading
  const error = bairrosError || servicesError

  const prevFingerprintRef = useRef('')

  useEffect(() => {
    // Wait for ALL data to load before computing scores.
    if (isLoading) return
    if (bairros.length === 0 || Object.keys(services).length === 0) return

    const fingerprint = [
      `b:${bairros.length}`,
      ...Object.entries(services).map(([k, v]) => `${k}:${v.length}`),
      `g:${greenAreas.length}`,
      `l:${busLines.length}`,
      `c:${crimeData.length}`,
    ].join('|')

    if (fingerprint === prevFingerprintRef.current) return
    prevFingerprintRef.current = fingerprint

    // Try localStorage cache first
    const cacheKey = `scores:${fingerprint}`
    const cached = cacheGet<BairroScore[]>(cacheKey)
    if (cached && cached.length === bairros.length) {
      setScores(cached)
      return
    }

    const controller = new AbortController()
    setComputing(true)

    calculateAllScoresAsync(
      bairros,
      services,
      greenAreas,
      busLines,
      crimeData.length > 0 ? crimeData : undefined,
      controller.signal,
    ).then((computed) => {
      if (controller.signal.aborted || computed.length === 0) return
      cacheSet(cacheKey, computed)
      cacheSet('scores', computed)
      setScores(computed)
      setComputing(false)
    })

    return () => controller.abort()
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

  return { scores, cityAverage, bairros, services, greenAreas, crimeData, isLoading: isLoading || computing, error }
}
