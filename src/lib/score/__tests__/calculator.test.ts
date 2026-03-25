import { describe, expect, it } from 'vitest'
import type { Bairro, ServiceFacility } from '@/lib/types'
import { calculateAllScores, calculateBairroScore } from '../calculator'

function makeBairro(codigo: string, lat: number, lng: number): Bairro {
  return {
    codigo,
    nome: `Bairro ${codigo}`,
    nmRegional: 'Matriz',
    cdRegional: '1',
    centroid: [lat, lng],
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng - 0.005, lat - 0.005],
          [lng + 0.005, lat - 0.005],
          [lng + 0.005, lat + 0.005],
          [lng - 0.005, lat + 0.005],
          [lng - 0.005, lat - 0.005],
        ],
      ],
    },
  }
}

describe('calculateBairroScore', () => {
  it('produces a valid score with empty services', () => {
    const bairro = makeBairro('001', -25.4284, -49.2733)
    const result = calculateBairroScore(bairro, [], [], [])

    expect(result.bairroCode).toBe('001')
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(100)
    expect(result.label).toBeDefined()
    expect(result.color).toBeDefined()
    expect(Object.keys(result.categories)).toHaveLength(7)
  })

  it('produces higher score with nearby facilities', () => {
    const bairro = makeBairro('002', -25.4284, -49.2733)
    const facilities: ServiceFacility[] = [
      {
        id: 'ubs-1',
        name: 'UBS Centro',
        category: 'saude',
        subcategory: 'UBS',
        coordinates: [-25.4285, -49.2734],
        layerId: 134,
      },
      {
        id: 'escola-1',
        name: 'Escola Centro',
        category: 'educacao',
        subcategory: 'Escola Municipal',
        coordinates: [-25.4285, -49.2734],
        layerId: 80,
      },
      {
        id: 'pm-1',
        name: 'PM Centro',
        category: 'seguranca',
        subcategory: 'Polícia Militar',
        coordinates: [-25.4285, -49.2734],
        layerId: 142,
      },
    ]

    const withFacilities = calculateBairroScore(bairro, facilities, [], [])
    const withoutFacilities = calculateBairroScore(bairro, [], [], [])

    expect(withFacilities.overall).toBeGreaterThan(withoutFacilities.overall)
  })

  it('all category scores are between 0 and 100', () => {
    const bairro = makeBairro('003', -25.4284, -49.2733)
    const result = calculateBairroScore(bairro, [], [], [])

    for (const cat of Object.values(result.categories)) {
      expect(cat.score).toBeGreaterThanOrEqual(0)
      expect(cat.score).toBeLessThanOrEqual(100)
    }
  })
})

describe('calculateAllScores', () => {
  it('ranks bairros correctly', () => {
    const bairros = [
      makeBairro('A', -25.4284, -49.2733),
      makeBairro('B', -25.5, -49.3),
      makeBairro('C', -25.45, -49.28),
    ]

    const results = calculateAllScores(bairros, [], [], [])

    expect(results).toHaveLength(3)
    expect(results[0].rank).toBe(1)
    expect(results[1].rank).toBe(2)
    expect(results[2].rank).toBe(3)

    // Scores should be in descending order
    expect(results[0].overall).toBeGreaterThanOrEqual(results[1].overall)
    expect(results[1].overall).toBeGreaterThanOrEqual(results[2].overall)
  })

  it('assigns percentiles', () => {
    const bairros = [
      makeBairro('A', -25.4284, -49.2733),
      makeBairro('B', -25.5, -49.3),
    ]

    const results = calculateAllScores(bairros, [], [], [])

    // First place should have higher percentile
    expect(results[0].percentile).toBeGreaterThanOrEqual(results[1].percentile)
  })

  it('handles single bairro', () => {
    const bairros = [makeBairro('A', -25.4284, -49.2733)]
    const results = calculateAllScores(bairros, [], [], [])

    expect(results).toHaveLength(1)
    expect(results[0].rank).toBe(1)
  })

  it('handles empty array', () => {
    const results = calculateAllScores([], [], [], [])
    expect(results).toHaveLength(0)
  })
})
