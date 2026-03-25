import { countWithinRadius, findNearest } from '@/lib/geo/nearest'
import { pointInPolygon } from '@/lib/geo/point-in-polygon'
import type { BusLine, CategoryScore, ServiceFacility } from '@/lib/types'

function scoreDistance(
  distance: number,
  thresholds: [number, number][],
): number {
  for (const [maxDist, score] of thresholds) {
    if (distance < maxDist) return score
  }
  return thresholds[thresholds.length - 1][1]
}

function scoreStopDensity(count: number): number {
  if (count >= 15) return 100
  if (count >= 10) return 85
  if (count >= 5) return 65
  if (count >= 2) return 40
  if (count === 1) return 20
  return 0
}

const TERMINAL_THRESHOLDS: [number, number][] = [
  [500, 100],
  [1000, 80],
  [2000, 60],
  [3000, 30],
  [Number.POSITIVE_INFINITY, 10],
]

function scoreLineVariety(count: number): number {
  if (count >= 10) return 100
  if (count >= 7) return 80
  if (count >= 4) return 60
  if (count >= 2) return 35
  if (count === 1) return 15
  return 0
}

export function calculateTransportScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
  bairroGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  busLines: BusLine[],
): CategoryScore {
  const stops = facilities.filter(
    (f) => f.category === 'transporte' && f.subcategory === 'Parada de Ônibus',
  )
  const terminals = facilities.filter(
    (f) => f.category === 'transporte' && f.subcategory === 'Terminal',
  )

  const stopCount = countWithinRadius(centroid, stops, 500)
  const nearestTerminal = findNearest(centroid, terminals)
  const terminalDistance = nearestTerminal?.distance ?? Number.POSITIVE_INFINITY

  let lineCount = 0
  for (const line of busLines) {
    const hasPointInBairro = line.coordinates.some((coord) =>
      pointInPolygon(coord, bairroGeometry),
    )
    if (hasPointInBairro) lineCount++
  }

  const stopScore = scoreStopDensity(stopCount)
  const terminalScore = scoreDistance(terminalDistance, TERMINAL_THRESHOLDS)
  const lineScore = scoreLineVariety(lineCount)

  const score = stopScore * 0.45 + terminalScore * 0.3 + lineScore * 0.25

  return {
    category: 'transporte',
    score: Math.round(score),
    factors: [
      {
        name: 'Paradas de ônibus (500m)',
        score: stopScore,
        rawValue: stopCount,
        description: `${stopCount} parada(s) em 500m`,
      },
      {
        name: 'Terminal mais próximo',
        score: terminalScore,
        rawValue: nearestTerminal ? Math.round(terminalDistance) : 'N/A',
        description: nearestTerminal
          ? `${nearestTerminal.facility.name} a ${Math.round(terminalDistance)}m`
          : 'Nenhum terminal encontrado',
      },
      {
        name: 'Variedade de linhas',
        score: lineScore,
        rawValue: lineCount,
        description: `${lineCount} linha(s) passando pelo bairro`,
      },
    ],
  }
}
