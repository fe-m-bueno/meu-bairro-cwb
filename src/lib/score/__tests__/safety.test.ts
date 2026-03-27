import { describe, expect, it } from 'vitest'
import type { BairroCrimeData, ServiceFacility } from '@/lib/types'
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

function makeCrimeData(
  overrides: Partial<BairroCrimeData> = {},
): BairroCrimeData {
  return {
    bairro: 'Test',
    totalOcorrencias12m: 100,
    ocorrenciasPorKm2: 50,
    naturezas: { FURTO: 40, AGRESSAO: 30, 'SOM ALTO': 30 },
    topNaturezas: [
      { nome: 'FURTO', count: 40 },
      { nome: 'AGRESSAO', count: 30 },
      { nome: 'SOM ALTO', count: 30 },
    ],
    tendencia: 'estavel',
    scorePercentil: 65,
    ...overrides,
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
      makeFacility('Policia Militar', -25.4285, -49.2734),
      makeFacility('Guarda Municipal', -25.4283, -49.2732),
      makeFacility('Policia Civil', -25.4286, -49.2735),
      makeFacility('Corpo de Bombeiros', -25.428, -49.273),
      makeFacility('Policia Militar', -25.429, -49.274),
    ]
    const result = calculateSafetyScore(CENTROID, facilities)
    expect(result.score).toBeGreaterThanOrEqual(85)
  })

  it('PM threshold: within 1km scores 100', () => {
    const close = makeFacility('Policia Militar', -25.4285, -49.2734)
    const result = calculateSafetyScore(CENTROID, [close])
    const pmFactor = result.factors.find((f) => f.name.includes('PM/Guarda'))
    expect(pmFactor?.score).toBe(100)
  })

  it('has 4 factors without crime data', () => {
    const result = calculateSafetyScore(CENTROID, [])
    expect(result.factors).toHaveLength(4)
  })

  it('density scores 50 for 2 facilities within 2km', () => {
    const facilities = [
      makeFacility('Policia Militar', -25.4285, -49.2734),
      makeFacility('Policia Civil', -25.429, -49.274),
    ]
    const result = calculateSafetyScore(CENTROID, facilities)
    const densityFactor = result.factors.find((f) =>
      f.name.includes('Densidade'),
    )
    expect(densityFactor?.score).toBe(50)
  })

  // Tests with crime data
  describe('with crime data', () => {
    it('has 5 factors when crime data is provided', () => {
      const crimeData = makeCrimeData()
      const result = calculateSafetyScore(CENTROID, [], crimeData)
      expect(result.factors).toHaveLength(5)
    })

    it('includes crime rate factor as first factor', () => {
      const crimeData = makeCrimeData({ scorePercentil: 85 })
      const result = calculateSafetyScore(CENTROID, [], crimeData)
      expect(result.factors[0].name).toBe('Taxa de ocorrências')
      expect(result.factors[0].score).toBe(85)
    })

    it('crime data with high percentil raises score', () => {
      const facilities = [makeFacility('Policia Militar', -25.4285, -49.2734)]
      const scoreWithout = calculateSafetyScore(CENTROID, facilities)
      const crimeData = makeCrimeData({ scorePercentil: 100 })
      const scoreWith = calculateSafetyScore(CENTROID, facilities, crimeData)
      expect(scoreWith.score).toBeGreaterThan(scoreWithout.score)
    })

    it('crime data with low percentil lowers score', () => {
      const facilities = [
        makeFacility('Policia Militar', -25.4285, -49.2734),
        makeFacility('Policia Civil', -25.4286, -49.2735),
        makeFacility('Corpo de Bombeiros', -25.428, -49.273),
        makeFacility('Guarda Municipal', -25.4283, -49.2732),
        makeFacility('Policia Militar', -25.429, -49.274),
      ]
      const scoreWithout = calculateSafetyScore(CENTROID, facilities)
      const crimeData = makeCrimeData({ scorePercentil: 5 })
      const scoreWith = calculateSafetyScore(CENTROID, facilities, crimeData)
      expect(scoreWith.score).toBeLessThan(scoreWithout.score)
    })

    it('shows tendencia in description', () => {
      const crimeData = makeCrimeData({ tendencia: 'subindo' })
      const result = calculateSafetyScore(CENTROID, [], crimeData)
      expect(result.factors[0].description).toContain('subindo')
    })

    it('uses rebalanced weights with crime data', () => {
      // With only crime data (no facilities), score should be 40% of crimeScore + minimums
      const crimeData = makeCrimeData({ scorePercentil: 100 })
      const result = calculateSafetyScore(CENTROID, [], crimeData)
      // 100 * 0.4 + 10 * 0.2 + 10 * 0.15 + 10 * 0.1 + 0 * 0.15 = 40 + 2 + 1.5 + 1 = 44.5 → 45
      expect(result.score).toBe(45)
    })
  })
})
