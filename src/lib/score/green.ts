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

function calculateCoveragePercentage(
  bairroGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  greenAreas: GreenArea[],
): number {
  try {
    // Dynamic imports are not ideal in sync functions, so we use require
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { polygon, multiPolygon, featureCollection } =
      require('@turf/helpers') as typeof import('@turf/helpers')
    const { default: intersect } =
      require('@turf/intersect') as typeof import('@turf/intersect')
    const { default: area } =
      require('@turf/area') as typeof import('@turf/area')

    const bairroFeature =
      bairroGeometry.type === 'MultiPolygon'
        ? multiPolygon(bairroGeometry.coordinates)
        : polygon(bairroGeometry.coordinates)

    const bairroArea = area(bairroFeature)
    if (bairroArea === 0) return 0

    let greenOverlapArea = 0

    for (const green of greenAreas) {
      try {
        const greenFeature =
          green.geometry.type === 'MultiPolygon'
            ? multiPolygon(green.geometry.coordinates)
            : polygon(green.geometry.coordinates)

        // biome-ignore lint/suspicious/noExplicitAny: turf type mismatch between Polygon and MultiPolygon features
        const fc = featureCollection([bairroFeature, greenFeature] as any[])
        // biome-ignore lint/suspicious/noExplicitAny: turf type narrowing
        const intersection = intersect(fc as any)

        if (intersection) {
          greenOverlapArea += area(intersection)
        }
      } catch {
        // Skip invalid geometries
      }
    }

    return (greenOverlapArea / bairroArea) * 100
  } catch {
    return 0
  }
}

export function calculateGreenScore(
  centroid: [number, number],
  greenAreas: GreenArea[],
  bairroGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): CategoryScore {
  // Find nearest green area by centroid distance
  let nearestDistance = Number.POSITIVE_INFINITY
  let nearestName = ''
  let countWithin2km = 0

  for (const green of greenAreas) {
    const greenCentroid = calculateCentroid(green.geometry)
    const dist = haversine(
      centroid[0],
      centroid[1],
      greenCentroid[0],
      greenCentroid[1],
    )
    if (dist < nearestDistance) {
      nearestDistance = dist
      nearestName = green.name
    }
    if (dist <= 2000) countWithin2km++
  }

  const coveragePercentage = calculateCoveragePercentage(
    bairroGeometry,
    greenAreas,
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
