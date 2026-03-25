import { describe, expect, it } from 'vitest'
import type { GreenArea, ServiceFacility } from '@/lib/types'
import { calculateVarietyScore } from '../variety'

const CENTROID: [number, number] = [-25.4284, -49.2733]

function makeFacility(
  category: ServiceFacility['category'],
  subcategory: string,
  lat: number,
  lng: number,
): ServiceFacility {
  return {
    id: `${category}-${subcategory}-${lat}`,
    name: `${subcategory} Test`,
    category,
    subcategory,
    coordinates: [lat, lng],
    layerId: 0,
  }
}

function makeGreenArea(): GreenArea {
  return {
    id: 'green-1',
    name: 'Parque Test',
    type: 'Parque',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-49.274, -25.429],
          [-49.273, -25.429],
          [-49.273, -25.428],
          [-49.274, -25.428],
          [-49.274, -25.429],
        ],
      ],
    },
    layerId: 0,
  }
}

describe('calculateVarietyScore', () => {
  it('returns category key diversidade', () => {
    const result = calculateVarietyScore(CENTROID, [], [])
    expect(result.category).toBe('diversidade')
  })

  it('returns 5 with no services', () => {
    const result = calculateVarietyScore(CENTROID, {}, [])
    expect(result.score).toBe(5)
  })

  it('returns 100 with all 6 categories present', () => {
    const services: Record<string, ServiceFacility[]> = {
      saude: [makeFacility('saude', 'UBS', -25.4285, -49.2734)],
      educacao: [
        makeFacility('educacao', 'Escola Municipal', -25.4285, -49.2734),
      ],
      seguranca: [
        makeFacility('seguranca', 'Policia Militar', -25.4285, -49.2734),
      ],
      transporte: [makeFacility('transporte', 'Parada', -25.4285, -49.2734)],
      cultura: [makeFacility('cultura', 'Biblioteca', -25.4285, -49.2734)],
    }
    const result = calculateVarietyScore(CENTROID, services, [makeGreenArea()])
    expect(result.score).toBe(100)
  })

  it('returns 80 with 5 categories present', () => {
    const services: Record<string, ServiceFacility[]> = {
      saude: [makeFacility('saude', 'UBS', -25.4285, -49.2734)],
      educacao: [
        makeFacility('educacao', 'Escola Municipal', -25.4285, -49.2734),
      ],
      seguranca: [
        makeFacility('seguranca', 'Policia Militar', -25.4285, -49.2734),
      ],
      transporte: [makeFacility('transporte', 'Parada', -25.4285, -49.2734)],
    }
    const result = calculateVarietyScore(CENTROID, services, [makeGreenArea()])
    expect(result.score).toBe(80)
  })

  it('correctly checks distance thresholds', () => {
    const services: Record<string, ServiceFacility[]> = {
      saude: [makeFacility('saude', 'UBS', -25.4285, -49.2734)],
      educacao: [makeFacility('educacao', 'Escola Municipal', -25.45, -49.3)],
    }
    const result = calculateVarietyScore(CENTROID, services, [])
    // Only health should count (education is >1.5km away)
    expect(result.score).toBe(5) // 1 category = 5
  })
})
