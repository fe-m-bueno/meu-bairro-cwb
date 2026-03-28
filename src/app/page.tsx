import { HomePageClient } from '@/components/home/home-page-client'
import { getHomePageData } from '@/lib/server/city-data'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const data = await getHomePageData()
    return <HomePageClient data={data} />
  } catch {
    return (
      <HomePageClient
        data={null}
        error="Erro ao carregar dados de Curitiba. Tente recarregar a página."
      />
    )
  }
}
