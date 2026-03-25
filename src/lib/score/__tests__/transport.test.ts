import { describe, expect, it } from 'vitest'
import type { BusLine, ServiceFacility } from '@/lib/types'
import { calculateTransportScore } from '../transport'

const CENTROID: [number, number] = [-25.4284, -49.2733]

// Simple square polygon around centroid (GeoJSON [lng, lat])
const BAIRRO_GEOMETRY: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-49.28, -25.42],
      [-49.27, -25.42],
      [-49.27, -25.43],
      [-49.28, -25.43],
      [-49.28, -25.42],
    ],
  ],
}

function makeStop(lat: number, lng: number): ServiceFacility {
  return {
    id: `stop-${lat}-${lng}`,
    name: 'Parada Test',
    category: 'transporte',
    subcategory: 'Parada',
    coordinates: [lat, lng],
    layerId: 1,
  }
}

function makeTerminal(lat: number, lng: number): ServiceFacility {
  return {
    id: `terminal-${lat}-${lng}`,
    name: 'Terminal Test',
    category: 'transporte',
    subcategory: 'Terminal',
    coordinates: [lat, lng],
    layerId: 0,
  }
}

describe('calculateTransportScore', () => {
  it('returns category key transporte', () => {
    const result = calculateTransportScore(CENTROID, [], BAIRRO_GEOMETRY, [])
    expect(result.category).toBe('transporte')
  })

  it('returns low score with no facilities', () => {
    const result = calculateTransportScore(CENTROID, [], BAIRRO_GEOMETRY, [])
    expect(result.score).toBeLessThanOrEqual(10)
  })

  it('returns high score with many stops, close terminal, and bus lines', () => {
    const stops: ServiceFacility[] = []
    for (let i = 0; i < 16; i++) {
      stops.push(makeStop(-25.4284 + i * 0.0001, -49.2733 + i * 0.0001))
    }
    const terminal = makeTerminal(-25.4285, -49.2734)

    const busLines: BusLine[] = Array.from({ length: 11 }, (_, i) => ({
      id: `line-${i}`,
      name: `Linha ${i}`,
      // Point inside the bairro polygon
      coordinates: [[-25.425, -49.275]],
    }))

    const result = calculateTransportScore(
      CENTROID,
      [...stops, terminal],
      BAIRRO_GEOMETRY,
      busLines,
    )
    expect(result.score).toBeGreaterThanOrEqual(90)
  })

  it('counts bus lines passing through bairro', () => {
    const insideLine: BusLine = {
      id: 'inside',
      name: 'Inside Line',
      coordinates: [[-25.425, -49.275]], // Inside polygon
    }
    const outsideLine: BusLine = {
      id: 'outside',
      name: 'Outside Line',
      coordinates: [[-25.5, -49.2]], // Outside polygon
    }

    const result = calculateTransportScore(CENTROID, [], BAIRRO_GEOMETRY, [
      insideLine,
      outsideLine,
    ])
    const lineFactor = result.factors.find((f) => f.name.includes('Variedade'))
    expect(lineFactor?.rawValue).toBe(1)
  })

  it('stop density threshold: 15+ gives 100', () => {
    const stops = Array.from({ length: 16 }, (_, i) =>
      makeStop(-25.4284 + i * 0.00005, -49.2733 + i * 0.00005),
    )
    const result = calculateTransportScore(CENTROID, stops, BAIRRO_GEOMETRY, [])
    const stopFactor = result.factors.find((f) => f.name.includes('Paradas'))
    expect(stopFactor?.score).toBe(100)
  })
})
