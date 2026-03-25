import { countWithinRadius, findNearest } from '@/lib/geo/nearest'
import type { CategoryScore, ServiceFacility } from '@/lib/types'

function scoreDistance(
  distance: number,
  thresholds: [number, number][],
): number {
  for (const [maxDist, score] of thresholds) {
    if (distance < maxDist) return score
  }
  return thresholds[thresholds.length - 1][1]
}

const SCHOOL_THRESHOLDS: [number, number][] = [
  [500, 100],
  [1000, 80],
  [1500, 50],
  [2000, 30],
  [Number.POSITIVE_INFINITY, 5],
]

function scoreDensity(count: number): number {
  if (count >= 6) return 100
  if (count >= 4) return 80
  if (count === 3) return 60
  if (count === 2) return 40
  if (count === 1) return 20
  return 0
}

export function calculateEducationScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const escolas = facilities.filter(
    (f) => f.category === 'educacao' && f.subcategory === 'Escola Municipal',
  )
  const cmeis = facilities.filter(
    (f) => f.category === 'educacao' && f.subcategory === 'CMEI',
  )
  const allEducation = facilities.filter((f) => f.category === 'educacao')

  const nearestEscola = findNearest(centroid, escolas)
  const nearestCmei = findNearest(centroid, cmeis)
  const density = countWithinRadius(centroid, allEducation, 1000)

  const escolaDistance = nearestEscola?.distance ?? Number.POSITIVE_INFINITY
  const cmeiDistance = nearestCmei?.distance ?? Number.POSITIVE_INFINITY

  const escolaScore = scoreDistance(escolaDistance, SCHOOL_THRESHOLDS)
  const cmeiScore = scoreDistance(cmeiDistance, SCHOOL_THRESHOLDS)
  const densityScore = scoreDensity(density)

  const score = (escolaScore + cmeiScore + densityScore) / 3

  return {
    category: 'educacao',
    score: Math.round(score),
    factors: [
      {
        name: 'Escola Municipal mais próxima',
        score: escolaScore,
        rawValue: nearestEscola ? Math.round(escolaDistance) : 'N/A',
        description: nearestEscola
          ? `${nearestEscola.facility.name} a ${Math.round(escolaDistance)}m`
          : 'Nenhuma escola municipal encontrada',
      },
      {
        name: 'CMEI mais próximo',
        score: cmeiScore,
        rawValue: nearestCmei ? Math.round(cmeiDistance) : 'N/A',
        description: nearestCmei
          ? `${nearestCmei.facility.name} a ${Math.round(cmeiDistance)}m`
          : 'Nenhum CMEI encontrado',
      },
      {
        name: 'Densidade educacional (1km)',
        score: densityScore,
        rawValue: density,
        description: `${density} unidade(s) de educação em 1km`,
      },
    ],
  }
}
