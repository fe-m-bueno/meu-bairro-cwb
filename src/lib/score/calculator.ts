import { calculateCentroid } from '@/lib/geo/centroid'
import type {
  Bairro,
  BairroCrimeData,
  BairroScore,
  BusLine,
  CategoryKey,
  CategoryScore,
  GreenArea,
  ServiceFacility,
} from '@/lib/types'
import { calculateCultureScore } from './culture'
import { calculateEducationScore } from './education'
import { calculateGreenScore, precomputeGreenCentroids } from './green'
import { calculateHealthScore } from './health'
import { calculateSafetyScore } from './safety'
import { calculateTransportScore, precomputeBusLineCounts } from './transport'
import { calculateVarietyScore } from './variety'
import { CATEGORY_WEIGHTS, getScoreLabel } from './weights'

export function calculateBairroScore(
  bairro: Bairro,
  services: Record<string, ServiceFacility[]>,
  greenAreas: GreenArea[],
  busLines: BusLine[],
  greenCentroids?: Map<string, [number, number]>,
  crimeData?: BairroCrimeData,
  precomputedBusLineCount?: number,
): BairroScore {
  const centroid = bairro.centroid ?? calculateCentroid(bairro.geometry)

  const categories: Record<CategoryKey, CategoryScore> = {
    saude: calculateHealthScore(centroid, services.saude ?? []),
    educacao: calculateEducationScore(centroid, services.educacao ?? []),
    seguranca: calculateSafetyScore(
      centroid,
      services.seguranca ?? [],
      crimeData,
    ),
    transporte: calculateTransportScore(
      centroid,
      services.transporte ?? [],
      bairro.geometry,
      busLines,
      precomputedBusLineCount,
    ),
    areasVerdes: calculateGreenScore(
      centroid,
      greenAreas,
      bairro.geometry,
      greenCentroids,
    ),
    cultura: calculateCultureScore(centroid, services.cultura ?? []),
    diversidade: calculateVarietyScore(centroid, services, greenAreas),
  }

  let overall = 0
  for (const key of Object.keys(CATEGORY_WEIGHTS) as CategoryKey[]) {
    overall += categories[key].score * CATEGORY_WEIGHTS[key]
  }
  overall = Math.round(overall)

  const label = getScoreLabel(overall)

  return {
    bairroCode: bairro.codigo,
    overall,
    label: label.label,
    color: label.color,
    categories,
    rank: 0,
    percentile: 0,
  }
}

function rankScores(scores: BairroScore[]): BairroScore[] {
  scores.sort((a, b) => b.overall - a.overall)
  const total = scores.length
  for (let i = 0; i < total; i++) {
    scores[i].rank = i + 1
    scores[i].percentile = Math.round(
      ((total - i - 1) / (total - 1 || 1)) * 100,
    )
  }
  return scores
}

export function calculateAllScores(
  bairros: Bairro[],
  services: Record<string, ServiceFacility[]>,
  greenAreas: GreenArea[],
  busLines: BusLine[],
  crimeDataList?: BairroCrimeData[],
): BairroScore[] {
  const greenCentroids = precomputeGreenCentroids(greenAreas)
  const busLineCounts = precomputeBusLineCounts(bairros, busLines)

  const crimeMap = new Map<string, BairroCrimeData>()
  if (crimeDataList) {
    for (const cd of crimeDataList) {
      crimeMap.set(cd.bairro.toLowerCase(), cd)
    }
  }

  const scores = bairros.map((b) => {
    const crimeData = crimeMap.get(b.nome.toLowerCase())
    return calculateBairroScore(
      b,
      services,
      greenAreas,
      busLines,
      greenCentroids,
      crimeData,
      busLineCounts.get(b.codigo),
    )
  })

  return rankScores(scores)
}

const CHUNK_SIZE = 10

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export async function calculateAllScoresAsync(
  bairros: Bairro[],
  services: Record<string, ServiceFacility[]>,
  greenAreas: GreenArea[],
  busLines: BusLine[],
  crimeDataList?: BairroCrimeData[],
  signal?: AbortSignal,
): Promise<BairroScore[]> {
  const greenCentroids = precomputeGreenCentroids(greenAreas)
  const busLineCounts = precomputeBusLineCounts(bairros, busLines)

  const crimeMap = new Map<string, BairroCrimeData>()
  if (crimeDataList) {
    for (const cd of crimeDataList) {
      crimeMap.set(cd.bairro.toLowerCase(), cd)
    }
  }

  const scores: BairroScore[] = []

  for (let i = 0; i < bairros.length; i += CHUNK_SIZE) {
    if (signal?.aborted) return []
    const chunk = bairros.slice(i, i + CHUNK_SIZE)
    for (const b of chunk) {
      const crimeData = crimeMap.get(b.nome.toLowerCase())
      scores.push(
        calculateBairroScore(
          b,
          services,
          greenAreas,
          busLines,
          greenCentroids,
          crimeData,
          busLineCounts.get(b.codigo),
        ),
      )
    }
    if (i + CHUNK_SIZE < bairros.length) {
      await yieldToMain()
    }
  }

  if (signal?.aborted) return []
  return rankScores(scores)
}
