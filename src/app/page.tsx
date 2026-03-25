'use client'

import dynamic from 'next/dynamic'
import { useCallback, useState } from 'react'
import { MapControls } from '@/components/map/map-controls'
import { NeighborhoodPanel } from '@/components/panel/neighborhood-panel'
import { AddressSearch } from '@/components/search/address-search'
import { useScores } from '@/hooks/use-scores'
import { findBairroForPoint } from '@/lib/geo/point-in-polygon'

const CityMap = dynamic(() => import('@/components/map/city-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
        <p className="text-sm text-zinc-400">Carregando mapa...</p>
      </div>
    </div>
  ),
})

export default function HomePage() {
  const { scores, cityAverage, bairros, services, isLoading, error } =
    useScores()
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null)
  const [searchedPoint, setSearchedPoint] = useState<[number, number] | null>(
    null,
  )
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set())

  const selectedScore = selectedBairro
    ? (scores.find((s) => s.bairroCode === selectedBairro) ?? null)
    : null
  const selectedBairroData = selectedBairro
    ? (bairros.find((b) => b.codigo === selectedBairro) ?? null)
    : null

  const handleSelectBairro = useCallback((codigo: string) => {
    setSelectedBairro(codigo)
  }, [])

  const handleSearchSelect = useCallback(
    (result: { lat: number; lng: number; displayName: string }) => {
      const point: [number, number] = [result.lat, result.lng]
      setSearchedPoint(point)
      const bairro = findBairroForPoint(point, bairros)
      if (bairro) {
        setSelectedBairro(bairro.codigo)
      }
    },
    [bairros],
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
  }, [])

  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/70">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
            <p className="text-sm text-zinc-400">
              Carregando dados de Curitiba...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/70">
          <div className="rounded-lg border border-red-800 bg-zinc-900 px-6 py-4">
            <p className="text-sm text-red-400">Erro ao carregar dados</p>
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
      />

      <CityMap
        bairros={bairros}
        scores={scores}
        services={services}
        onSelectBairro={handleSelectBairro}
        searchedPoint={searchedPoint}
        visibleLayers={visibleLayers}
      />

      {selectedScore && selectedBairroData && (
        <NeighborhoodPanel
          bairro={selectedBairroData}
          score={selectedScore}
          cityAverage={cityAverage}
          services={services}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
