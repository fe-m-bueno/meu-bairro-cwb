'use client'

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'
import { useScores } from '@/hooks/use-scores'
import { getScoreLabel } from '@/lib/score/weights'
import type { BairroScore } from '@/lib/types'

const CityMap = dynamic(() => import('@/components/map/city-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900">
      <p className="text-zinc-400">Carregando mapa...</p>
    </div>
  ),
})

export default function HomePage() {
  const { scores, bairros, isLoading, error } = useScores()
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null)

  const scoreMap = useMemo(() => {
    const map = new Map<string, BairroScore>()
    for (const score of scores) {
      map.set(score.bairroCode, score)
    }
    return map
  }, [scores])

  const selectedScore = selectedBairro ? scoreMap.get(selectedBairro) : null
  const selectedBairroData = selectedBairro
    ? bairros.find((b) => b.codigo === selectedBairro)
    : null

  const handleSelectBairro = useCallback((codigo: string) => {
    setSelectedBairro(codigo)
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
            <p className="mt-1 text-xs text-zinc-500">{error}</p>
          </div>
        </div>
      )}

      <CityMap
        bairros={bairros}
        scores={scores}
        onSelectBairro={handleSelectBairro}
      />

      {selectedScore && selectedBairroData && (
        <div className="absolute bottom-4 left-4 z-[1000] w-72 rounded-lg border border-zinc-700 bg-zinc-900/95 p-4 shadow-xl backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSelectedBairro(null)}
            className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300"
            aria-label="Fechar"
          >
            &times;
          </button>
          <h3 className="text-lg font-semibold text-zinc-100">
            {selectedBairroData.nome}
          </h3>
          <p className="text-xs text-zinc-500">
            {selectedBairroData.nmRegional}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className="text-3xl font-bold"
              style={{ color: getScoreLabel(selectedScore.overall).color }}
            >
              {Math.round(selectedScore.overall)}
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: getScoreLabel(selectedScore.overall).color }}
            >
              {selectedScore.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Melhor que {Math.round(selectedScore.percentile)}% dos bairros
          </p>
        </div>
      )}
    </div>
  )
}
