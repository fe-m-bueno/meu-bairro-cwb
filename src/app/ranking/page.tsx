'use client'

import { RankingTable } from '@/components/ranking/ranking-table'
import { Skeleton } from '@/components/ui/skeleton'
import { useScores } from '@/hooks/use-scores'

export default function RankingPage() {
  const { scores, bairros, isLoading, error } = useScores()

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">
          Ranking dos Bairros — Meu Bairro CWB
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Todos os 75 bairros de Curitiba ordenados pelo índice geral de
          qualidade de vida. Clique em qualquer linha para ver o bairro no mapa.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-zinc-900 px-5 py-4">
          <p className="text-sm text-red-400">
            Erro ao carregar dados. Tente recarregar a página.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-9 flex-1 bg-zinc-800" />
            <Skeleton className="h-9 w-56 bg-zinc-800" />
          </div>
          <Skeleton className="h-4 w-40 bg-zinc-800" />
          <div className="rounded-lg border border-zinc-800">
            <div className="p-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                  key={i}
                  className="mb-1 h-12 w-full bg-zinc-800"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && scores.length > 0 && (
        <RankingTable scores={scores} bairros={bairros} />
      )}
    </div>
  )
}
