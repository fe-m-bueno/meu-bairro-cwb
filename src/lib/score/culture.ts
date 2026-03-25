import { countWithinRadius, findNearest } from '@/lib/geo/nearest'
import type { CategoryScore, ServiceFacility } from '@/lib/types'

function scoreDensity(count: number): number {
  if (count >= 5) return 100
  if (count >= 3) return 75
  if (count === 2) return 50
  if (count === 1) return 25
  return 0
}

function scoreNearest(distance: number): number {
  if (distance < 500) return 100
  if (distance < 1000) return 70
  if (distance < 2000) return 40
  return 10
}

export function calculateCultureScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const cultureFacilities = facilities.filter((f) => f.category === 'cultura')

  const density = countWithinRadius(centroid, cultureFacilities, 1000)
  const nearest = findNearest(centroid, cultureFacilities)
  const nearestDistance = nearest?.distance ?? Number.POSITIVE_INFINITY

  const densityScore = scoreDensity(density)
  const nearestScore =
    cultureFacilities.length > 0 ? scoreNearest(nearestDistance) : 0

  const score = (densityScore + nearestScore) / 2

  return {
    category: 'cultura',
    score: Math.round(score),
    factors: [
      {
        name: 'Densidade cultural (1km)',
        score: densityScore,
        rawValue: density,
        description: `${density} equipamento(s) cultural/esportivo em 1km`,
      },
      {
        name: 'Equipamento mais próximo',
        score: nearestScore,
        rawValue: nearest ? Math.round(nearestDistance) : 'N/A',
        description: nearest
          ? `${nearest.facility.name} a ${Math.round(nearestDistance)}m`
          : 'Nenhum equipamento cultural encontrado',
      },
    ],
  }
}
