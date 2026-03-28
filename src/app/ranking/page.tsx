import { Footer } from '@/components/layout/footer'
import { RankingTable } from '@/components/ranking/ranking-table'
import { getRankingPageData } from '@/lib/server/city-data'

export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  try {
    const data = await getRankingPageData()

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

          <RankingTable
            scores={data.scores}
            bairros={data.bairros}
            services={data.services}
            greenAreas={data.greenAreas}
            crimeData={data.crimeData}
          />
        </div>
        <Footer />
      </>
    )
  } catch {
    return (
      <>
        <div className="mx-auto max-w-[1600px] px-4 py-8">
          <div className="rounded-lg border border-destructive bg-card px-5 py-4">
            <p className="text-sm text-destructive">
              Erro ao carregar dados. Tente recarregar a página.
            </p>
          </div>
        </div>
        <Footer />
      </>
    )
  }
}
