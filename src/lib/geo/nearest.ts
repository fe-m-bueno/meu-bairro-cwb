import type { ServiceFacility } from '@/lib/types'
import { haversine } from './haversine'

export interface FacilityWithDistance {
  facility: ServiceFacility
  distance: number
}

export function findNearest(
  origin: [number, number],
  facilities: ServiceFacility[],
): FacilityWithDistance | null {
  if (facilities.length === 0) return null
  let best: FacilityWithDistance | null = null
  for (const f of facilities) {
    const d = haversine(
      origin[0],
      origin[1],
      f.coordinates[0],
      f.coordinates[1],
    )
    if (!best || d < best.distance) best = { facility: f, distance: d }
  }
  return best
}

export function findWithinRadius(
  origin: [number, number],
  facilities: ServiceFacility[],
  radiusMeters: number,
): FacilityWithDistance[] {
  const results: FacilityWithDistance[] = []
  const degBuffer = radiusMeters / 111000 + 0.01
  for (const f of facilities) {
    if (
      Math.abs(f.coordinates[0] - origin[0]) > degBuffer ||
      Math.abs(f.coordinates[1] - origin[1]) > degBuffer
    )
      continue
    const d = haversine(
      origin[0],
      origin[1],
      f.coordinates[0],
      f.coordinates[1],
    )
    if (d <= radiusMeters) results.push({ facility: f, distance: d })
  }
  return results.sort((a, b) => a.distance - b.distance)
}

export function countWithinRadius(
  origin: [number, number],
  facilities: ServiceFacility[],
  radiusMeters: number,
): number {
  return findWithinRadius(origin, facilities, radiusMeters).length
}
