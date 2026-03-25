import { describe, expect, it } from 'vitest'
import type { ServiceFacility } from '@/lib/types'
import { calculateCultureScore } from '../culture'

const CENTROID: [number, number] = [-25.4284, -49.2733]

function makeFacility(lat: number, lng: number): ServiceFacility {
  return {
    id: `cultura-${lat}-${lng}`,
    name: 'Biblioteca Test',
    category: 'cultura',
    subcategory: 'Biblioteca',
    coordinates: [lat, lng],
    layerId: 0,
  }
}

describe('calculateCultureScore', () => {
  it('returns category key cultura', () => {
    const result = calculateCultureScore(CENTROID, [])
    expect(result.category).toBe('cultura')
  })

  it('returns 0 with no facilities', () => {
    const result = calculateCultureScore(CENTROID, [])
    expect(result.score).toBe(0)
  })

  it('returns high score with many close facilities', () => {
    const facilities = [
      makeFacility(-25.4285, -49.2734),
      makeFacility(-25.4283, -49.2732),
      makeFacility(-25.4286, -49.2735),
      makeFacility(-25.428, -49.273),
      makeFacility(-25.429, -49.274),
    ]
    const result = calculateCultureScore(CENTROID, facilities)
    expect(result.score).toBeGreaterThanOrEqual(90)
  })

  it('density threshold: 5+ gives 100', () => {
    const facilities = Array.from({ length: 5 }, (_, i) =>
      makeFacility(-25.4284 + i * 0.0002, -49.2733 + i * 0.0002),
    )
    const result = calculateCultureScore(CENTROID, facilities)
    const densityFactor = result.factors.find((f) =>
      f.name.includes('Densidade'),
    )
    expect(densityFactor?.score).toBe(100)
  })

  it('nearest threshold: within 500m gives 100', () => {
    const close = makeFacility(-25.4285, -49.2734)
    const result = calculateCultureScore(CENTROID, [close])
    const nearestFactor = result.factors.find((f) =>
      f.name.includes('mais próximo'),
    )
    expect(nearestFactor?.score).toBe(100)
  })

  it('ignores non-culture facilities', () => {
    const nonCulture: ServiceFacility = {
      id: 'saude-1',
      name: 'UBS',
      category: 'saude',
      subcategory: 'UBS',
      coordinates: [-25.4285, -49.2734],
      layerId: 0,
    }
    const result = calculateCultureScore(CENTROID, [nonCulture])
    expect(result.score).toBe(0)
  })
})
