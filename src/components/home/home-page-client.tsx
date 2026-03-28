'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapFooter } from '@/components/layout/map-footer'
import { MapControls } from '@/components/map/map-controls'
import { ComparePanel } from '@/components/panel/compare-panel'
import { CompareSelectionPanel } from '@/components/panel/compare-selection-panel'
import { NeighborhoodPanel } from '@/components/panel/neighborhood-panel'
import { AddressSearch } from '@/components/search/address-search'
import { findBairroForPoint } from '@/lib/geo/point-in-polygon'
import type { HomePageDataPayload } from '@/lib/types'
import {
  getBairroHref,
  getCompareHref,
  getCompareSelectionHref,
  getNormalizedHrefFromLegacyPathname,
  getSearchParamsFromLegacyPathname,
  getSelectionFromSearchParams,
} from './home-page-state'

const CityMap = dynamic(() => import('@/components/map/city-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-emerald-500" />
        <p className="text-sm text-muted-foreground">Carregando mapa...</p>
      </div>
    </div>
  ),
})

interface HomePageClientProps {
  data: HomePageDataPayload | null
  error?: string
}

export function HomePageClient({ data, error }: HomePageClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchedPoint, setSearchedPoint] = useState<[number, number] | null>(
    null,
  )
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set())

  const bairros = data?.bairros ?? []
  const scores = data?.scores ?? []
  const services = data?.services ?? {}
  const cityAverage = data?.cityAverage ?? null

  const validBairros = useMemo(
    () => new Set(bairros.map((bairro) => bairro.codigo)),
    [bairros],
  )

  const legacySearchParams = useMemo(
    () => getSearchParamsFromLegacyPathname(pathname),
    [pathname],
  )

  const { selectedBairro, compareBairro, isSelectingCompareBairro } = useMemo(() => {
    const primarySelection = getSelectionFromSearchParams(
      searchParams,
      validBairros,
    )

    if (
      primarySelection.selectedBairro ||
      primarySelection.compareBairro ||
      primarySelection.isSelectingCompareBairro ||
      !legacySearchParams
    ) {
      return primarySelection
    }

    return getSelectionFromSearchParams(legacySearchParams, validBairros)
  }, [searchParams, validBairros, legacySearchParams])

  useEffect(() => {
    const normalizedHref = getNormalizedHrefFromLegacyPathname(pathname)
    if (normalizedHref) {
      router.replace(normalizedHref, { scroll: false })
    }
  }, [pathname, router])

  const selectedScore = selectedBairro
    ? (scores.find((score) => score.bairroCode === selectedBairro) ?? null)
    : null
  const selectedBairroData = selectedBairro
    ? (bairros.find((bairro) => bairro.codigo === selectedBairro) ?? null)
    : null

  const compareBairroData = compareBairro
    ? (bairros.find((bairro) => bairro.codigo === compareBairro) ?? null)
    : null
  const compareScore = compareBairro
    ? (scores.find((score) => score.bairroCode === compareBairro) ?? null)
    : null

  const markerCounts = useMemo(() => data?.serviceCounts ?? {}, [data])

  const handleSelectBairro = useCallback(
    (codigo: string) => {
      if (isSelectingCompareBairro && selectedBairro) {
        if (codigo === selectedBairro) return

        router.replace(getCompareHref(selectedBairro, codigo), {
          scroll: false,
        })
        return
      }

      router.replace(getBairroHref(codigo), { scroll: false })
    },
    [isSelectingCompareBairro, selectedBairro, router],
  )

  const handleSearchSelect = useCallback(
    (result: { lat: number; lng: number; displayName: string }) => {
      const point: [number, number] = [result.lat, result.lng]
      setSearchedPoint(point)
      const bairro = findBairroForPoint(point, bairros)
      if (bairro) {
        router.replace(getBairroHref(bairro.codigo), { scroll: false })
      }
    },
    [bairros, router],
  )

  const handleSearchClear = useCallback(() => {
    setSearchedPoint(null)
  }, [])

  const handleToggleLayer = useCallback((category: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleClosePanel = useCallback(() => {
    router.replace('/', { scroll: false })
  }, [router])

  const handleStartCompare = useCallback(() => {
    if (!selectedBairro) return
    router.replace(getCompareSelectionHref(selectedBairro), { scroll: false })
  }, [selectedBairro, router])

  const handleExitCompare = useCallback(() => {
    if (selectedBairro) {
      router.replace(getBairroHref(selectedBairro), { scroll: false })
      return
    }

    router.replace('/', { scroll: false })
  }, [selectedBairro, router])

  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden">
      {error && (
        <div className="pointer-events-none absolute inset-0 z-[2000] flex items-center justify-center bg-background/70">
          <div className="pointer-events-auto rounded-lg border border-red-800 bg-card px-6 py-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      <AddressSearch
        onSelect={handleSearchSelect}
        onClear={handleSearchClear}
      />

      <MapControls
        visibleLayers={visibleLayers}
        onToggleLayer={handleToggleLayer}
        markerCounts={markerCounts}
      />

      <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-1">
        <span className="text-[10px] font-medium text-muted-foreground">
          Score de Qualidade
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">0</span>
          <div
            className="h-2 w-24 rounded-full"
            style={{
              background:
                'linear-gradient(to right, #ef4444, #f59e0b, #eab308, #84cc16, #22c55e, #10b981)',
            }}
          />
          <span className="text-[10px] text-muted-foreground">100</span>
        </div>
      </div>

      <MapFooter />

      <CityMap
        bairros={bairros}
        scores={scores}
        services={services}
        onSelectBairro={handleSelectBairro}
        searchedPoint={searchedPoint}
        visibleLayers={visibleLayers}
        panelOpen={
          !!selectedBairro || !!compareBairro || isSelectingCompareBairro
        }
        selectedCentroid={selectedBairroData?.centroid ?? null}
      />

      {compareBairro &&
      selectedBairroData &&
      selectedScore &&
      compareBairroData &&
      compareScore ? (
        <ComparePanel
          bairroA={selectedBairroData}
          scoreA={selectedScore}
          bairroB={compareBairroData}
          scoreB={compareScore}
          cityAverage={cityAverage}
          onClose={handleExitCompare}
        />
      ) : isSelectingCompareBairro && selectedBairroData ? (
        <CompareSelectionPanel
          bairro={selectedBairroData}
          onClose={handleExitCompare}
        />
      ) : (
        selectedScore &&
        selectedBairroData && (
          <NeighborhoodPanel
            bairro={selectedBairroData}
            score={selectedScore}
            cityAverage={cityAverage}
            services={services}
            onClose={handleClosePanel}
            onStartCompare={handleStartCompare}
          />
        )
      )}
    </div>
  )
}
