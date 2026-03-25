import { calculateCentroid } from '@/lib/geo/centroid'
import { haversine } from '@/lib/geo/haversine'
import type { CategoryScore, GreenArea } from '@/lib/types'

function scoreDistance(
  distance: number,
  thresholds: [number, number][],
): number {
  for (const [maxDist, score] of thresholds) {
    if (distance < maxDist) return score
  }
  return thresholds[thresholds.length - 1][1]
}

const NEAREST_THRESHOLDS: [number, number][] = [
  [300, 100],
  [500, 85],
  [1000, 65],
  [2000, 35],
  [Number.POSITIVE_INFINITY, 10],
]

function scoreCoverage(percentage: number): number {
  if (percentage > 15) return 100
  if (percentage > 10) return 80
  if (percentage > 5) return 55
  if (percentage > 1) return 30
  return 5
}

function scoreCount(count: number): number {
  if (count >= 4) return 100
  if (count === 3) return 75
  if (count === 2) return 50
  if (count === 1) return 25
  return 0
}

/**
 * Estimate green coverage using a proximity heuristic instead of expensive
 * Turf.js polygon intersections. Counts green areas whose centroid falls
 * within 1km of the bairro centroid and scales by density. This avoids
 * blocking the main thread with O(n²) polygon boolean operations.
 */
function estimateCoveragePercentage(
  bairroCentroid: [number, number],
  greenAreas: GreenArea[],
  greenCentroids: Map<string, [number, number]>,
): number {
  let nearbyCount = 0
  for (const green of greenAreas) {
    const gc = greenCentroids.get(green.id)
    if (!gc) continue
    const dist = haversine(bairroCentroid[0], bairroCentroid[1], gc[0], gc[1])
    if (dist <= 1000) nearbyCount++
  }
  // Heuristic: each nearby green area contributes ~5% coverage, capped at 25%
  return Math.min(nearbyCount * 5, 25)
}

/**
 * Pre-compute centroids for all green areas once.
 * Call this once and pass the result to calculateGreenScore for each bairro.
 */
export function precomputeGreenCentroids(
  greenAreas: GreenArea[],
): Map<string, [number, number]> {
  const centroids = new Map<string, [number, number]>()
  for (const green of greenAreas) {
    try {
      centroids.set(green.id, calculateCentroid(green.geometry))
    } catch {
      // skip invalid geometry
    }
  }
  return centroids
}

export function calculateGreenScore(
  centroid: [number, number],
  greenAreas: GreenArea[],
  _bairroGeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  greenCentroids?: Map<string, [number, number]>,
): CategoryScore {
  // Use pre-computed centroids if available, otherwise compute on the fly
  const centroids = greenCentroids ?? precomputeGreenCentroids(greenAreas)

  // Find nearest green area by centroid distance
  let nearestDistance = Number.POSITIVE_INFINITY
  let nearestName = ''
  let countWithin2km = 0

  for (const green of greenAreas) {
    const gc = centroids.get(green.id)
    if (!gc) continue
    const dist = haversine(centroid[0], centroid[1], gc[0], gc[1])
    if (dist < nearestDistance) {
      nearestDistance = dist
      nearestName = green.name
    }
    if (dist <= 2000) countWithin2km++
  }

  const coveragePercentage = estimateCoveragePercentage(
    centroid,
    greenAreas,
    centroids,
  )

  const nearestScore =
    greenAreas.length > 0
      ? scoreDistance(nearestDistance, NEAREST_THRESHOLDS)
      : 10
  const coverageScore = scoreCoverage(coveragePercentage)
  const countScore = scoreCount(countWithin2km)

  const score = nearestScore * 0.4 + coverageScore * 0.35 + countScore * 0.25

  return {
    category: 'areasVerdes',
    score: Math.round(score),
    factors: [
      {
        name: 'Parque/bosque mais próximo',
        score: nearestScore,
        rawValue: greenAreas.length > 0 ? Math.round(nearestDistance) : 'N/A',
        description:
          greenAreas.length > 0
            ? `${nearestName} a ${Math.round(nearestDistance)}m`
            : 'Nenhuma área verde encontrada',
      },
      {
        name: 'Cobertura verde',
        score: coverageScore,
        rawValue: `${coveragePercentage.toFixed(1)}%`,
        description: `${coveragePercentage.toFixed(1)}% do bairro é área verde`,
      },
      {
        name: 'Parques em 2km',
        score: countScore,
        rawValue: countWithin2km,
        description: `${countWithin2km} parque(s)/bosque(s) em 2km`,
      },
    ],
  }
}
