import { describe, expect, it } from 'vitest'
import type { GreenArea } from '@/lib/types'
import { calculateGreenScore } from '../green'

const CENTROID: [number, number] = [-25.4284, -49.2733]

const BAIRRO_GEOMETRY: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-49.28, -25.42],
      [-49.27, -25.42],
      [-49.27, -25.44],
      [-49.28, -25.44],
      [-49.28, -25.42],
    ],
  ],
}

function makeGreenArea(
  name: string,
  lat: number,
  lng: number,
  size = 0.002,
): GreenArea {
  return {
    id: `green-${name}`,
    name,
    type: 'Parque',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng - size, lat - size],
          [lng + size, lat - size],
          [lng + size, lat + size],
          [lng - size, lat + size],
          [lng - size, lat - size],
        ],
      ],
    },
    layerId: 0,
  }
}

describe('calculateGreenScore', () => {
  it('returns category key areasVerdes', () => {
    const result = calculateGreenScore(CENTROID, [], BAIRRO_GEOMETRY)
    expect(result.category).toBe('areasVerdes')
  })

  it('returns low score with no green areas', () => {
    const result = calculateGreenScore(CENTROID, [], BAIRRO_GEOMETRY)
    expect(result.score).toBeLessThanOrEqual(15)
  })

  it('returns high score with nearby green areas', () => {
    const greens = [
      makeGreenArea('Parque 1', -25.4285, -49.2734, 0.005),
      makeGreenArea('Parque 2', -25.43, -49.275),
      makeGreenArea('Parque 3', -25.425, -49.271),
      makeGreenArea('Parque 4', -25.427, -49.272),
    ]
    const result = calculateGreenScore(CENTROID, greens, BAIRRO_GEOMETRY)
    expect(result.score).toBeGreaterThanOrEqual(50)
  })

  it('has 3 factors', () => {
    const result = calculateGreenScore(CENTROID, [], BAIRRO_GEOMETRY)
    expect(result.factors).toHaveLength(3)
  })

  it('nearest threshold: very close park scores high', () => {
    const close = makeGreenArea('Parque Próximo', -25.4285, -49.2734)
    const result = calculateGreenScore(CENTROID, [close], BAIRRO_GEOMETRY)
    const nearestFactor = result.factors.find((f) =>
      f.name.includes('mais próximo'),
    )
    expect(nearestFactor?.score).toBe(100)
  })

  it('count threshold: 4+ within 2km scores 100', () => {
    const greens = [
      makeGreenArea('P1', -25.4285, -49.2734),
      makeGreenArea('P2', -25.43, -49.275),
      makeGreenArea('P3', -25.427, -49.272),
      makeGreenArea('P4', -25.426, -49.271),
    ]
    const result = calculateGreenScore(CENTROID, greens, BAIRRO_GEOMETRY)
    const countFactor = result.factors.find((f) =>
      f.name.includes('Parques em 2km'),
    )
    expect(countFactor?.score).toBe(100)
  })
})
