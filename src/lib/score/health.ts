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

const UBS_THRESHOLDS: [number, number][] = [
  [500, 100],
  [1000, 80],
  [2000, 50],
  [3000, 20],
  [Number.POSITIVE_INFINITY, 5],
]

const HOSPITAL_THRESHOLDS: [number, number][] = [
  [1000, 100],
  [2000, 80],
  [3000, 60],
  [5000, 30],
  [Number.POSITIVE_INFINITY, 5],
]

function scoreDensity(count: number): number {
  if (count >= 5) return 100
  if (count === 4) return 80
  if (count === 3) return 60
  if (count === 2) return 40
  if (count === 1) return 20
  return 0
}

export function calculateHealthScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const ubsFacilities = facilities.filter(
    (f) => f.category === 'saude' && f.subcategory === 'UBS',
  )
  const hospitalFacilities = facilities.filter(
    (f) =>
      f.category === 'saude' &&
      (f.subcategory === 'Hospital' || f.subcategory === 'UPA'),
  )
  const allHealth = facilities.filter((f) => f.category === 'saude')

  const nearestUbs = findNearest(centroid, ubsFacilities)
  const nearestHospital = findNearest(centroid, hospitalFacilities)
  const density = countWithinRadius(centroid, allHealth, 1000)

  const ubsDistance = nearestUbs?.distance ?? Number.POSITIVE_INFINITY
  const hospitalDistance = nearestHospital?.distance ?? Number.POSITIVE_INFINITY

  const ubsScore = scoreDistance(ubsDistance, UBS_THRESHOLDS)
  const hospitalScore = scoreDistance(hospitalDistance, HOSPITAL_THRESHOLDS)
  const densityScore = scoreDensity(density)

  const score = ubsScore * 0.4 + hospitalScore * 0.35 + densityScore * 0.25

  return {
    category: 'saude',
    score: Math.round(score),
    factors: [
      {
        name: 'UBS mais próxima',
        score: ubsScore,
        rawValue: nearestUbs ? Math.round(ubsDistance) : 'N/A',
        description: nearestUbs
          ? `${nearestUbs.facility.name} a ${Math.round(ubsDistance)}m`
          : 'Nenhuma UBS encontrada',
      },
      {
        name: 'Hospital/UPA mais próximo',
        score: hospitalScore,
        rawValue: nearestHospital ? Math.round(hospitalDistance) : 'N/A',
        description: nearestHospital
          ? `${nearestHospital.facility.name} a ${Math.round(hospitalDistance)}m`
          : 'Nenhum hospital/UPA encontrado',
      },
      {
        name: 'Densidade de saúde (1km)',
        score: densityScore,
        rawValue: density,
        description: `${density} unidade(s) de saúde em 1km`,
      },
    ],
  }
}
