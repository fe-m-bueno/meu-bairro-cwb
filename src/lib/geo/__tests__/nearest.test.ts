import { describe, expect, it } from 'vitest'
import type { ServiceFacility } from '@/lib/types'
import { countWithinRadius, findNearest, findWithinRadius } from '../nearest'

const mockFacilities: ServiceFacility[] = [
  {
    id: '1',
    name: 'Close',
    category: 'saude',
    subcategory: 'UBS',
    coordinates: [-25.4284, -49.2733],
    layerId: 134,
  },
  {
    id: '2',
    name: 'Far',
    category: 'saude',
    subcategory: 'Hospital',
    coordinates: [-25.5, -49.4],
    layerId: 129,
  },
  {
    id: '3',
    name: 'Medium',
    category: 'saude',
    subcategory: 'UPA',
    coordinates: [-25.43, -49.28],
    layerId: 130,
  },
]

describe('findNearest', () => {
  it('returns null for an empty array', () => {
    expect(findNearest([-25.4284, -49.2733], [])).toBeNull()
  })

  it('returns distance 0 when origin matches a facility exactly', () => {
    const result = findNearest([-25.4284, -49.2733], mockFacilities)
    expect(result).not.toBeNull()
    expect(result?.facility.name).toBe('Close')
    expect(result?.distance).toBe(0)
  })

  it('returns the closest facility', () => {
    // Origin near "Medium" facility
    const result = findNearest([-25.431, -49.279], mockFacilities)
    expect(result).not.toBeNull()
    expect(result?.facility.name).toBe('Medium')
  })

  it('distance is in meters (reasonable range for Curitiba)', () => {
    // From Praça Tiradentes to "Far" facility ~15km
    const result = findNearest([-25.4284, -49.2733], [mockFacilities[1]])
    expect(result?.distance).toBeGreaterThan(10000)
    expect(result?.distance).toBeLessThan(20000)
  })
})

describe('findWithinRadius', () => {
  it('finds facilities within the radius', () => {
    // 500m radius from the "Close" facility — should include Close and possibly Medium
    const origin: [number, number] = [-25.4284, -49.2733]
    const results = findWithinRadius(origin, mockFacilities, 500)
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].facility.name).toBe('Close')
    expect(results[0].distance).toBe(0)
  })

  it('excludes facilities beyond the radius', () => {
    const origin: [number, number] = [-25.4284, -49.2733]
    // 1m radius — only the exact match
    const results = findWithinRadius(origin, mockFacilities, 1)
    expect(results.length).toBe(1)
    expect(results[0].facility.name).toBe('Close')
  })

  it('returns results sorted by distance ascending', () => {
    const origin: [number, number] = [-25.4284, -49.2733]
    const results = findWithinRadius(origin, mockFacilities, 10000)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distance).toBeGreaterThanOrEqual(
        results[i - 1].distance,
      )
    }
  })

  it('returns empty array when no facilities are within radius', () => {
    // Use an origin far from all mock facilities (in the ocean, roughly)
    const origin: [number, number] = [-23.0, -46.0]
    const results = findWithinRadius(origin, mockFacilities, 100)
    expect(results).toHaveLength(0)
  })
})

describe('countWithinRadius', () => {
  it('counts facilities within radius correctly', () => {
    const origin: [number, number] = [-25.4284, -49.2733]
    const count = countWithinRadius(origin, mockFacilities, 10000)
    expect(count).toBeGreaterThanOrEqual(2)
  })

  it('returns 0 for a tiny radius with no matches', () => {
    // Origin far from all mock facilities
    const origin: [number, number] = [-23.0, -46.0]
    const count = countWithinRadius(origin, mockFacilities, 100)
    expect(count).toBe(0)
  })

  it('returns 1 when only the exact match facility is within radius', () => {
    const origin: [number, number] = [-25.4284, -49.2733]
    const count = countWithinRadius(origin, mockFacilities, 1)
    expect(count).toBe(1)
  })
})
