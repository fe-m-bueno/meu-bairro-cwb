import { countWithinRadius, findNearest } from '@/lib/geo/nearest'
import { pointInPolygon } from '@/lib/geo/point-in-polygon'
import type {
  Bairro,
  BusLine,
  CategoryScore,
  ServiceFacility,
} from '@/lib/types'

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

interface BoundingBox {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

function createBoundingBox(points: [number, number][]): BoundingBox {
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY
  let minLng = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY

  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }

  return { minLat, maxLat, minLng, maxLng }
}

function getGeometryBoundingBoxes(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): BoundingBox[] {
  const rings =
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates.map((polygon) => polygon[0])
      : [geometry.coordinates[0]]

  return rings.map((ring) =>
    createBoundingBox(ring.map(([lng, lat]) => [lat, lng])),
  )
}

function boundingBoxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.maxLat < b.minLat ||
    a.minLat > b.maxLat ||
    a.maxLng < b.minLng ||
    a.minLng > b.maxLng
  )
}

function pointWithinBoundingBox(
  point: [number, number],
  boundingBox: BoundingBox,
): boolean {
  return (
    point[0] >= boundingBox.minLat &&
    point[0] <= boundingBox.maxLat &&
    point[1] >= boundingBox.minLng &&
    point[1] <= boundingBox.maxLng
  )
}

export function countBusLinesInBairro(
  bairroGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  busLines: BusLine[],
  lineBoundingBoxes = busLines.map((line) =>
    createBoundingBox(line.coordinates),
  ),
): number {
  const bairroBoundingBoxes = getGeometryBoundingBoxes(bairroGeometry)
  let lineCount = 0

  for (let index = 0; index < busLines.length; index++) {
    const line = busLines[index]
    const lineBoundingBox = lineBoundingBoxes[index]

    if (
      !bairroBoundingBoxes.some((bbox) =>
        boundingBoxesOverlap(bbox, lineBoundingBox),
      )
    ) {
      continue
    }

    const hasPointInBairro = line.coordinates.some(
      (coordinate) =>
        bairroBoundingBoxes.some((bbox) =>
          pointWithinBoundingBox(coordinate, bbox),
        ) && pointInPolygon(coordinate, bairroGeometry),
    )

    if (hasPointInBairro) lineCount++
  }

  return lineCount
}

export function precomputeBusLineCounts(
  bairros: Bairro[],
  busLines: BusLine[],
): Map<string, number> {
  const lineBoundingBoxes = busLines.map((line) =>
    createBoundingBox(line.coordinates),
  )
  const counts = new Map<string, number>()

  for (const bairro of bairros) {
    counts.set(
      bairro.codigo,
      countBusLinesInBairro(bairro.geometry, busLines, lineBoundingBoxes),
    )
  }

  return counts
}

export function calculateTransportScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
  bairroGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  busLines: BusLine[],
  precomputedLineCount?: number,
): CategoryScore {
  const stops = facilities.filter(
    (f) => f.category === 'transporte' && f.subcategory === 'Parada',
  )
  const terminals = facilities.filter(
    (f) => f.category === 'transporte' && f.subcategory === 'Terminal',
  )

  const stopCount = countWithinRadius(centroid, stops, 500)
  const nearestTerminal = findNearest(centroid, terminals)
  const terminalDistance = nearestTerminal?.distance ?? Number.POSITIVE_INFINITY

  const lineCount =
    precomputedLineCount ?? countBusLinesInBairro(bairroGeometry, busLines)

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
