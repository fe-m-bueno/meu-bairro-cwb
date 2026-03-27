'use client'

import { Footer } from '@/components/layout/footer'
import { RankingTable } from '@/components/ranking/ranking-table'
import { Skeleton } from '@/components/ui/skeleton'
import { useScores } from '@/hooks/use-scores'

export default function RankingPage() {
  const { scores, bairros, services, greenAreas, crimeData, isLoading, error } = useScores()

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground font-heading">
            Ranking dos Bairros — Meu Bairro CWB
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos os 75 bairros de Curitiba ordenados pelo índice geral de
            qualidade de vida. Clique em qualquer linha para ver o bairro no
            mapa.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-card px-5 py-4">
            <p className="text-sm text-destructive">
              Erro ao carregar dados. Tente recarregar a página.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Skeleton className="h-9 flex-1 bg-muted" />
              <Skeleton className="h-9 w-56 bg-muted" />
            </div>
            <Skeleton className="h-4 w-40 bg-muted" />
            <div className="rounded-lg border border-border">
              <div className="p-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                    key={i}
                    className="mb-1 h-12 w-full bg-muted"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && scores.length > 0 && (
          <RankingTable scores={scores} bairros={bairros} services={services} greenAreas={greenAreas} crimeData={crimeData} />
        )}
      </div>
      <Footer />
    </>
  )
}
