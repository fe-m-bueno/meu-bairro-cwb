import { describe, expect, it } from 'vitest'
import type { Bairro } from '@/lib/types'
import { findBairroForPoint, pointInPolygon } from '../point-in-polygon'

// Square polygon in GeoJSON [lng, lat] coords
// Bounding box: lng [-49.1, -48.9], lat [-25.1, -24.9]
const squarePolygon: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-49.1, -25.1],
      [-48.9, -25.1],
      [-48.9, -24.9],
      [-49.1, -24.9],
      [-49.1, -25.1],
    ],
  ],
}

describe('pointInPolygon', () => {
  it('returns true for a point inside the polygon', () => {
    // Center point [lat, lng]
    expect(pointInPolygon([-25.0, -49.0], squarePolygon)).toBe(true)
  })

  it('returns false for a point outside the polygon', () => {
    // Just outside the bounding box
    expect(pointInPolygon([-25.2, -49.0], squarePolygon)).toBe(false)
  })

  it('returns false for a point far away', () => {
    expect(pointInPolygon([-23.0, -46.0], squarePolygon)).toBe(false)
  })

  it('returns true for a point inside a MultiPolygon', () => {
    const multiPolygon: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [squarePolygon.coordinates],
    }
    expect(pointInPolygon([-25.0, -49.0], multiPolygon)).toBe(true)
  })

  it('returns false for a point outside all rings of a MultiPolygon', () => {
    const multiPolygon: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [squarePolygon.coordinates],
    }
    expect(pointInPolygon([-26.0, -50.0], multiPolygon)).toBe(false)
  })
})

describe('findBairroForPoint', () => {
  const mockBairros: Bairro[] = [
    {
      codigo: '001',
      nome: 'Bairro A',
      nmRegional: 'Regional 1',
      cdRegional: '1',
      geometry: squarePolygon,
      centroid: [-25.0, -49.0],
    },
    {
      codigo: '002',
      nome: 'Bairro B',
      nmRegional: 'Regional 2',
      cdRegional: '2',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-50.1, -26.1],
            [-49.9, -26.1],
            [-49.9, -25.9],
            [-50.1, -25.9],
            [-50.1, -26.1],
          ],
        ],
      },
      centroid: [-26.0, -50.0],
    },
  ]

  it('finds the correct bairro for a point', () => {
    const result = findBairroForPoint([-25.0, -49.0], mockBairros)
    expect(result).not.toBeNull()
    expect(result?.nome).toBe('Bairro A')
  })

  it('finds the second bairro for a point in its polygon', () => {
    const result = findBairroForPoint([-26.0, -50.0], mockBairros)
    expect(result).not.toBeNull()
    expect(result?.nome).toBe('Bairro B')
  })

  it('returns null when point is in no bairro', () => {
    const result = findBairroForPoint([-10.0, -40.0], mockBairros)
    expect(result).toBeNull()
  })
})
