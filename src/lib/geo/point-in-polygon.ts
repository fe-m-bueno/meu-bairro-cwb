import type { Bairro } from '@/lib/types'

export function pointInPolygon(
  point: [number, number],
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): boolean {
  const [lat, lng] = point
  const rings =
    polygon.type === 'MultiPolygon'
      ? polygon.coordinates.map((p) => p[0])
      : [polygon.coordinates[0]]
  for (const ring of rings) {
    if (isInsideRing(lat, lng, ring)) return true
  }
  return false
}

function isInsideRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = [ring[i][0], ring[i][1]]
    const [xj, yj] = [ring[j][0], ring[j][1]]
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }
  return inside
}

export function findBairroForPoint(
  point: [number, number],
  bairros: Bairro[],
): Bairro | null {
  return bairros.find((b) => pointInPolygon(point, b.geometry)) ?? null
}
