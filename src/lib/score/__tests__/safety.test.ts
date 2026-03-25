import { describe, expect, it } from 'vitest'
import type { ServiceFacility } from '@/lib/types'
import { calculateSafetyScore } from '../safety'

const CENTROID: [number, number] = [-25.4284, -49.2733]

function makeFacility(
  subcategory: string,
  lat: number,
  lng: number,
): ServiceFacility {
  return {
    id: `${subcategory}-${lat}-${lng}`,
    name: `${subcategory} Test`,
    category: 'seguranca',
    subcategory,
    coordinates: [lat, lng],
    layerId: 0,
  }
}

describe('calculateSafetyScore', () => {
  it('returns category key seguranca', () => {
    const result = calculateSafetyScore(CENTROID, [])
    expect(result.category).toBe('seguranca')
  })

  it('returns low score with no facilities', () => {
    const result = calculateSafetyScore(CENTROID, [])
    expect(result.score).toBeLessThanOrEqual(15)
  })

  it('returns high score with close facilities', () => {
    const facilities = [
      makeFacility('Polícia Militar', -25.4285, -49.2734),
      makeFacility('Guarda Municipal', -25.4283, -49.2732),
      makeFacility('Polícia Civil', -25.4286, -49.2735),
      makeFacility('Corpo de Bombeiros', -25.428, -49.273),
      makeFacility('Polícia Militar', -25.429, -49.274),
    ]
    const result = calculateSafetyScore(CENTROID, facilities)
    expect(result.score).toBeGreaterThanOrEqual(85)
  })

  it('PM threshold: within 1km scores 100', () => {
    const close = makeFacility('Polícia Militar', -25.4285, -49.2734)
    const result = calculateSafetyScore(CENTROID, [close])
    const pmFactor = result.factors.find((f) => f.name.includes('PM/Guarda'))
    expect(pmFactor?.score).toBe(100)
  })

  it('has 4 factors', () => {
    const result = calculateSafetyScore(CENTROID, [])
    expect(result.factors).toHaveLength(4)
  })

  it('density scores 50 for 2 facilities within 2km', () => {
    const facilities = [
      makeFacility('Polícia Militar', -25.4285, -49.2734),
      makeFacility('Polícia Civil', -25.429, -49.274),
    ]
    const result = calculateSafetyScore(CENTROID, facilities)
    const densityFactor = result.factors.find((f) =>
      f.name.includes('Densidade'),
    )
    expect(densityFactor?.score).toBe(50)
  })
})
