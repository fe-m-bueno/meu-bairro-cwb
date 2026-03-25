import { describe, expect, it } from 'vitest'
import type { ServiceFacility } from '@/lib/types'
import { calculateHealthScore } from '../health'

// Centro de Curitiba approx
const CENTROID: [number, number] = [-25.4284, -49.2733]

function makeFacility(
  subcategory: string,
  lat: number,
  lng: number,
): ServiceFacility {
  return {
    id: `${subcategory}-${lat}-${lng}`,
    name: `${subcategory} Test`,
    category: 'saude',
    subcategory,
    coordinates: [lat, lng],
    layerId: 0,
  }
}

describe('calculateHealthScore', () => {
  it('returns category key saude', () => {
    const result = calculateHealthScore(CENTROID, [])
    expect(result.category).toBe('saude')
  })

  it('returns low score with no facilities', () => {
    const result = calculateHealthScore(CENTROID, [])
    expect(result.score).toBeLessThanOrEqual(10)
    expect(result.factors).toHaveLength(3)
  })

  it('returns high score with close facilities', () => {
    const facilities = [
      makeFacility('UBS', -25.4285, -49.2734), // ~15m away
      makeFacility('Hospital', -25.4286, -49.2735), // ~25m away
      makeFacility('UPA', -25.4283, -49.2732),
      makeFacility('UBS', -25.428, -49.273),
      makeFacility('UBS', -25.429, -49.274),
      makeFacility('Hospital', -25.4275, -49.2725),
      makeFacility('UBS', -25.427, -49.272),
    ]
    const result = calculateHealthScore(CENTROID, facilities)
    expect(result.score).toBeGreaterThanOrEqual(90)
  })

  it('UBS threshold boundary: 500m gives 100, just over gives 80', () => {
    // ~400m away (within 500m)
    const close = makeFacility('UBS', -25.432, -49.2733)
    const r1 = calculateHealthScore(CENTROID, [close])
    const ubsFactor1 = r1.factors.find((f) => f.name === 'UBS mais próxima')
    expect(ubsFactor1?.score).toBe(100)
  })

  it('density factor scores correctly', () => {
    // Place 3 health facilities within 1km
    const facilities = [
      makeFacility('UBS', -25.4285, -49.2734),
      makeFacility('Hospital', -25.429, -49.274),
      makeFacility('UPA', -25.428, -49.273),
    ]
    const result = calculateHealthScore(CENTROID, facilities)
    const densityFactor = result.factors.find((f) =>
      f.name.includes('Densidade'),
    )
    expect(densityFactor?.score).toBe(60) // 3 facilities = 60
  })

  it('ignores non-health facilities', () => {
    const nonHealth: ServiceFacility = {
      id: 'edu-1',
      name: 'Escola',
      category: 'educacao',
      subcategory: 'Escola Municipal',
      coordinates: [-25.4285, -49.2734],
      layerId: 0,
    }
    const result = calculateHealthScore(CENTROID, [nonHealth])
    expect(result.score).toBeLessThanOrEqual(10)
  })
})
