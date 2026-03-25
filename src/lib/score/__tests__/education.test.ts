import { describe, expect, it } from 'vitest'
import type { ServiceFacility } from '@/lib/types'
import { calculateEducationScore } from '../education'

const CENTROID: [number, number] = [-25.4284, -49.2733]

function makeFacility(
  subcategory: string,
  lat: number,
  lng: number,
): ServiceFacility {
  return {
    id: `${subcategory}-${lat}-${lng}`,
    name: `${subcategory} Test`,
    category: 'educacao',
    subcategory,
    coordinates: [lat, lng],
    layerId: 0,
  }
}

describe('calculateEducationScore', () => {
  it('returns category key educacao', () => {
    const result = calculateEducationScore(CENTROID, [])
    expect(result.category).toBe('educacao')
  })

  it('returns low score with no facilities', () => {
    const result = calculateEducationScore(CENTROID, [])
    expect(result.score).toBeLessThanOrEqual(10)
  })

  it('returns high score with close facilities', () => {
    const facilities = [
      makeFacility('Escola Municipal', -25.4285, -49.2734),
      makeFacility('CMEI', -25.4283, -49.2732),
      makeFacility('Escola Municipal', -25.428, -49.273),
      makeFacility('CMEI', -25.429, -49.274),
      makeFacility('Escola Municipal', -25.4275, -49.2725),
      makeFacility('CMEI', -25.427, -49.272),
    ]
    const result = calculateEducationScore(CENTROID, facilities)
    expect(result.score).toBeGreaterThanOrEqual(90)
  })

  it('escola threshold: within 500m scores 100', () => {
    const close = makeFacility('Escola Municipal', -25.4285, -49.2734)
    const result = calculateEducationScore(CENTROID, [close])
    const escolaFactor = result.factors.find((f) =>
      f.name.includes('Escola Municipal'),
    )
    expect(escolaFactor?.score).toBe(100)
  })

  it('density scores 80 for 4-5 facilities', () => {
    const facilities = [
      makeFacility('Escola Municipal', -25.4285, -49.2734),
      makeFacility('CMEI', -25.4283, -49.2732),
      makeFacility('Escola Municipal', -25.428, -49.273),
      makeFacility('CMEI', -25.429, -49.274),
    ]
    const result = calculateEducationScore(CENTROID, facilities)
    const densityFactor = result.factors.find((f) =>
      f.name.includes('Densidade'),
    )
    expect(densityFactor?.score).toBe(80)
  })
})
