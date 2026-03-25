import { calculateCentroid } from '@/lib/geo/centroid'
import type {
  Bairro,
  BairroScore,
  BusLine,
  CategoryKey,
  CategoryScore,
  GreenArea,
  ServiceFacility,
} from '@/lib/types'
import { calculateCultureScore } from './culture'
import { calculateEducationScore } from './education'
import { calculateGreenScore } from './green'
import { calculateHealthScore } from './health'
import { calculateSafetyScore } from './safety'
import { calculateTransportScore } from './transport'
import { calculateVarietyScore } from './variety'
import { CATEGORY_WEIGHTS, getScoreLabel } from './weights'

export function calculateBairroScore(
  bairro: Bairro,
  services: ServiceFacility[],
  greenAreas: GreenArea[],
  busLines: BusLine[],
): BairroScore {
  const centroid = bairro.centroid ?? calculateCentroid(bairro.geometry)

  const categories: Record<CategoryKey, CategoryScore> = {
    saude: calculateHealthScore(centroid, services),
    educacao: calculateEducationScore(centroid, services),
    seguranca: calculateSafetyScore(centroid, services),
    transporte: calculateTransportScore(
      centroid,
      services,
      bairro.geometry,
      busLines,
    ),
    areasVerdes: calculateGreenScore(centroid, greenAreas, bairro.geometry),
    cultura: calculateCultureScore(centroid, services),
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

export function calculateAllScores(
  bairros: Bairro[],
  services: ServiceFacility[],
  greenAreas: GreenArea[],
  busLines: BusLine[],
): BairroScore[] {
  const scores = bairros.map((b) =>
    calculateBairroScore(b, services, greenAreas, busLines),
  )

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
