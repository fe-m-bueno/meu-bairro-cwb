import { describe, expect, it } from 'vitest'
import { CATEGORY_WEIGHTS, getScoreLabel, SCORE_LABELS } from '../weights'

describe('weights', () => {
  it('weights sum to 1.0', () => {
    const sum = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0)
  })

  it('has 6 score labels covering 0-100', () => {
    expect(SCORE_LABELS).toHaveLength(6)
    expect(SCORE_LABELS[SCORE_LABELS.length - 1].min).toBe(0)
    expect(SCORE_LABELS[0].max).toBe(100)
  })

  it('getScoreLabel returns Excelente for 90', () => {
    const label = getScoreLabel(90)
    expect(label.label).toBe('Excelente')
    expect(label.color).toBe('#10b981')
  })

  it('getScoreLabel returns Crítico for 10', () => {
    const label = getScoreLabel(10)
    expect(label.label).toBe('Crítico')
    expect(label.color).toBe('#ef4444')
  })

  it('getScoreLabel returns Muito Bom for 70', () => {
    expect(getScoreLabel(70).label).toBe('Muito Bom')
  })

  it('getScoreLabel returns Bom for 55', () => {
    expect(getScoreLabel(55).label).toBe('Bom')
  })

  it('getScoreLabel returns Regular for 40', () => {
    expect(getScoreLabel(40).label).toBe('Regular')
  })

  it('getScoreLabel returns Abaixo da Média for 30', () => {
    expect(getScoreLabel(30).label).toBe('Abaixo da Média')
  })

  it('getScoreLabel clamps values above 100', () => {
    expect(getScoreLabel(150).label).toBe('Excelente')
  })

  it('getScoreLabel clamps values below 0', () => {
    expect(getScoreLabel(-5).label).toBe('Crítico')
  })

  it('boundary: 85 is Excelente, 84 is Muito Bom', () => {
    expect(getScoreLabel(85).label).toBe('Excelente')
    expect(getScoreLabel(84).label).toBe('Muito Bom')
  })
})
