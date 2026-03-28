import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  fetchAllServices,
  fetchBairros,
  fetchBusLines,
  fetchGreenAreas,
} from '@/lib/api'
import { calculateAllScores } from '@/lib/score'
import type {
  Bairro,
  BairroCrimeData,
  BairroScore,
  BusLine,
  GreenArea,
  HomePageDataPayload,
  RankingPageDataPayload,
  ServiceCounts,
  ServiceFacility,
  TransportMeta,
} from '@/lib/types'

interface CityDataSource {
  bairros: Bairro[]
  services: Record<string, ServiceFacility[]>
  greenAreas: GreenArea[]
  busLines: BusLine[]
  crimeData: BairroCrimeData[]
}

interface MemoryEntry<T> {
  expiresAt: number
  value: T
}

const CACHE_TTL_MS = 60 * 60 * 1000
const crimeDataPath = path.join(
  process.cwd(),
  'public',
  'data',
  'ocorrencias-por-bairro.json',
)

let sourceCache: MemoryEntry<CityDataSource> | null = null
let sourcePromise: Promise<CityDataSource> | null = null

async function loadCrimeDataServer(): Promise<BairroCrimeData[]> {
  try {
    const raw = await readFile(crimeDataPath, 'utf8')
    const parsed = JSON.parse(raw) as BairroCrimeData[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function buildServiceCounts(
  services: Record<string, ServiceFacility[]>,
): ServiceCounts {
  return Object.fromEntries(
    Object.entries(services).map(([category, facilities]) => [
      category,
      facilities.length,
    ]),
  )
}

function buildTransportMeta(
  transportFacilities: ServiceFacility[] | undefined,
): TransportMeta {
  const facilities = transportFacilities ?? []
  const terminais = facilities.filter(
    (facility) => facility.subcategory === 'Terminal',
  ).length
  const paradas = facilities.length - terminais

  return {
    total: facilities.length,
    paradas,
    terminais,
  }
}

function buildCityAverage(
  scores: BairroScore[],
): Record<string, number> | null {
  if (scores.length === 0) return null

  const categories = [
    'saude',
    'educacao',
    'seguranca',
    'transporte',
    'areasVerdes',
    'cultura',
    'diversidade',
  ] as const

  const cityAverage: Record<string, number> = {}
  for (const category of categories) {
    cityAverage[category] = Math.round(
      scores.reduce((sum, score) => sum + score.categories[category].score, 0) /
        scores.length,
    )
  }

  cityAverage.overall = Math.round(
    scores.reduce((sum, score) => sum + score.overall, 0) / scores.length,
  )

  return cityAverage
}

function buildBasePayload(source: CityDataSource) {
  const scores = calculateAllScores(
    source.bairros,
    source.services,
    source.greenAreas,
    source.busLines,
    source.crimeData,
  )

  return {
    bairros: source.bairros,
    scores,
    cityAverage: buildCityAverage(scores),
    services: source.services,
    serviceCounts: buildServiceCounts(source.services),
    transportMeta: buildTransportMeta(source.services.transporte),
  }
}

export function buildHomePageDataPayload(
  source: CityDataSource,
): HomePageDataPayload {
  return buildBasePayload(source)
}

export function buildRankingPageDataPayload(
  source: CityDataSource,
): RankingPageDataPayload {
  return {
    ...buildBasePayload(source),
    greenAreas: source.greenAreas,
    crimeData: source.crimeData,
  }
}

async function loadCityDataSource(): Promise<CityDataSource> {
  const [bairros, services, greenAreas, busLines, crimeData] =
    await Promise.all([
      fetchBairros(),
      fetchAllServices(),
      fetchGreenAreas(),
      fetchBusLines(),
      loadCrimeDataServer(),
    ])

  return { bairros, services, greenAreas, busLines, crimeData }
}

export async function getCityDataSource(): Promise<CityDataSource> {
  if (sourceCache && sourceCache.expiresAt > Date.now()) {
    return sourceCache.value
  }

  if (!sourcePromise) {
    sourcePromise = loadCityDataSource()
      .then((value) => {
        sourceCache = {
          value,
          expiresAt: Date.now() + CACHE_TTL_MS,
        }
        return value
      })
      .finally(() => {
        sourcePromise = null
      })
  }

  return sourcePromise
}

export async function getHomePageData(): Promise<HomePageDataPayload> {
  const source = await getCityDataSource()
  return buildHomePageDataPayload(source)
}

export async function getRankingPageData(): Promise<RankingPageDataPayload> {
  const source = await getCityDataSource()
  return buildRankingPageDataPayload(source)
}
