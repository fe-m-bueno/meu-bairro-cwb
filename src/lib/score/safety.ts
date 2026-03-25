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

const PM_THRESHOLDS: [number, number][] = [
  [1000, 100],
  [2000, 70],
  [3000, 40],
  [Number.POSITIVE_INFINITY, 10],
]

const DELEGACIA_THRESHOLDS: [number, number][] = [
  [2000, 100],
  [3000, 70],
  [5000, 40],
  [Number.POSITIVE_INFINITY, 10],
]

const BOMBEIROS_THRESHOLDS: [number, number][] = [
  [2000, 100],
  [3000, 70],
  [5000, 40],
  [Number.POSITIVE_INFINITY, 10],
]

function scoreDensity(count: number): number {
  if (count >= 4) return 100
  if (count === 3) return 75
  if (count === 2) return 50
  if (count === 1) return 25
  return 0
}

export function calculateSafetyScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const pmGuarda = facilities.filter(
    (f) =>
      f.category === 'seguranca' &&
      (f.subcategory === 'Policia Militar' ||
        f.subcategory === 'Guarda Municipal'),
  )
  const delegacias = facilities.filter(
    (f) => f.category === 'seguranca' && f.subcategory === 'Policia Civil',
  )
  const bombeiros = facilities.filter(
    (f) => f.category === 'seguranca' && f.subcategory === 'Corpo de Bombeiros',
  )
  const allSecurity = facilities.filter((f) => f.category === 'seguranca')

  const nearestPm = findNearest(centroid, pmGuarda)
  const nearestDelegacia = findNearest(centroid, delegacias)
  const nearestBombeiros = findNearest(centroid, bombeiros)
  const density = countWithinRadius(centroid, allSecurity, 2000)

  const pmDistance = nearestPm?.distance ?? Number.POSITIVE_INFINITY
  const delegaciaDistance =
    nearestDelegacia?.distance ?? Number.POSITIVE_INFINITY
  const bombeirosDistance =
    nearestBombeiros?.distance ?? Number.POSITIVE_INFINITY

  const pmScore = scoreDistance(pmDistance, PM_THRESHOLDS)
  const delegaciaScore = scoreDistance(delegaciaDistance, DELEGACIA_THRESHOLDS)
  const bombeirosScore = scoreDistance(bombeirosDistance, BOMBEIROS_THRESHOLDS)
  const densityScore = scoreDensity(density)

  const score =
    pmScore * 0.35 +
    delegaciaScore * 0.25 +
    bombeirosScore * 0.2 +
    densityScore * 0.2

  return {
    category: 'seguranca',
    score: Math.round(score),
    factors: [
      {
        name: 'PM/Guarda mais próxima',
        score: pmScore,
        rawValue: nearestPm ? Math.round(pmDistance) : 'N/A',
        description: nearestPm
          ? `${nearestPm.facility.name} a ${Math.round(pmDistance)}m`
          : 'Nenhuma PM/Guarda encontrada',
      },
      {
        name: 'Delegacia mais próxima',
        score: delegaciaScore,
        rawValue: nearestDelegacia ? Math.round(delegaciaDistance) : 'N/A',
        description: nearestDelegacia
          ? `${nearestDelegacia.facility.name} a ${Math.round(delegaciaDistance)}m`
          : 'Nenhuma delegacia encontrada',
      },
      {
        name: 'Bombeiros mais próximo',
        score: bombeirosScore,
        rawValue: nearestBombeiros ? Math.round(bombeirosDistance) : 'N/A',
        description: nearestBombeiros
          ? `${nearestBombeiros.facility.name} a ${Math.round(bombeirosDistance)}m`
          : 'Nenhum corpo de bombeiros encontrado',
      },
      {
        name: 'Densidade de segurança (2km)',
        score: densityScore,
        rawValue: density,
        description: `${density} unidade(s) de segurança em 2km`,
      },
    ],
  }
}
