'use client'

import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { MapControls } from '@/components/map/map-controls'
import { MapFooter } from '@/components/layout/map-footer'
import { CompareView } from '@/components/panel/compare-view'
import { NeighborhoodPanel } from '@/components/panel/neighborhood-panel'
import { AddressSearch } from '@/components/search/address-search'
import { useScores } from '@/hooks/use-scores'
import { findBairroForPoint } from '@/lib/geo/point-in-polygon'

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

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { scores, cityAverage, bairros, services, isLoading, error } =
    useScores()
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null)
  const [searchedPoint, setSearchedPoint] = useState<[number, number] | null>(
    null,
  )
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)
  const [compareBairro, setCompareBairro] = useState<string | null>(null)

  // Read ?bairro= from URL on mount and when bairros load
  useEffect(() => {
    const bairroParam = searchParams.get('bairro')
    if (bairroParam && bairros.length > 0) {
      const exists = bairros.some((b) => b.codigo === bairroParam)
      if (exists) {
        setSelectedBairro(bairroParam)
      }
    }
  }, [searchParams, bairros])

  const selectedScore = selectedBairro
    ? (scores.find((s) => s.bairroCode === selectedBairro) ?? null)
    : null
  const selectedBairroData = selectedBairro
    ? (bairros.find((b) => b.codigo === selectedBairro) ?? null)
    : null

  const compareBairroData = compareBairro
    ? (bairros.find((b) => b.codigo === compareBairro) ?? null)
    : null
  const compareScore = compareBairro
    ? (scores.find((s) => s.bairroCode === compareBairro) ?? null)
    : null

  const markerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [cat, facilities] of Object.entries(services)) {
      const cap = { saude: 200, educacao: 200, seguranca: 100, transporte: 300, cultura: 150 }[cat] ?? 100
      counts[cat] = Math.min(facilities.length, cap)
    }
    return counts
  }, [services])

  const handleSelectBairro = useCallback(
    (codigo: string) => {
      if (compareMode && selectedBairro && codigo !== selectedBairro) {
        setCompareBairro(codigo)
        setCompareMode(false)
        return
      }
      setSelectedBairro(codigo)
      setCompareBairro(null)
      router.replace(`/?bairro=${codigo}`, { scroll: false })
    },
    [compareMode, selectedBairro, router],
  )

  const handleSearchSelect = useCallback(
    (result: { lat: number; lng: number; displayName: string }) => {
      const point: [number, number] = [result.lat, result.lng]
      setSearchedPoint(point)
      const bairro = findBairroForPoint(point, bairros)
      if (bairro) {
        setSelectedBairro(bairro.codigo)
        setCompareBairro(null)
        router.replace(`/?bairro=${bairro.codigo}`, { scroll: false })
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
    setSelectedBairro(null)
    setCompareBairro(null)
    setCompareMode(false)
    router.replace('/', { scroll: false })
  }, [router])

  const handleStartCompare = useCallback(() => {
    setCompareMode(true)
    setCompareBairro(null)
  }, [])

  const handleExitCompare = useCallback(() => {
    setCompareMode(false)
    setCompareBairro(null)
  }, [])

  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden">
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/70">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-emerald-500" />
            <p className="text-sm text-muted-foreground">
              Carregando dados de Curitiba...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/70">
          <div className="pointer-events-auto rounded-lg border border-red-800 bg-card px-6 py-4">
            <p className="text-sm text-red-400">Erro ao carregar dados</p>
          </div>
        </div>
      )}

      {compareMode && !compareBairro && (
        <div className="pointer-events-auto absolute top-16 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-emerald-700 bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <p className="text-sm text-foreground">
              Clique em outro bairro para comparar
            </p>
            <button
              type="button"
              onClick={handleExitCompare}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancelar
            </button>
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
        panelOpen={!!selectedBairro || !!compareBairro}
        selectedCentroid={selectedBairroData?.centroid ?? null}
      />

      {compareBairro &&
      selectedBairroData &&
      selectedScore &&
      compareBairroData &&
      compareScore ? (
        <div className="fixed top-14 right-0 z-[1001] flex h-[calc(100vh-3.5rem)] w-[400px] flex-col border-l border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Comparando bairros
            </span>
            <button
              type="button"
              onClick={handleExitCompare}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fechar comparação"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <title>Fechar</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CompareView
              bairroA={selectedBairroData}
              scoreA={selectedScore}
              bairroB={compareBairroData}
              scoreB={compareScore}
              cityAverage={cityAverage}
            />
          </div>
        </div>
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

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
