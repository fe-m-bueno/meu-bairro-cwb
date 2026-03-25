import { describe, expect, it } from 'vitest'
import { haversine } from '../haversine'

describe('haversine', () => {
  it('returns 0 for the same point', () => {
    expect(haversine(-25.4284, -49.2733, -25.4284, -49.2733)).toBe(0)
  })

  it('calculates known Curitiba distance (~7.5km from Praça Tiradentes to Parque Barigui)', () => {
    // Praça Tiradentes: -25.4284, -49.2733
    // Parque Barigui: -25.4128, -49.3397
    const distance = haversine(-25.4284, -49.2733, -25.4128, -49.3397)
    // Expected ~6.6km — allow ±500m tolerance
    expect(distance).toBeGreaterThan(6000)
    expect(distance).toBeLessThan(7500)
  })

  it('calculates 1 degree of latitude as approximately 111km', () => {
    const distance = haversine(0, 0, 1, 0)
    expect(distance).toBeGreaterThan(110000)
    expect(distance).toBeLessThan(112000)
  })

  it('is symmetric (A to B equals B to A)', () => {
    const d1 = haversine(-25.4284, -49.2733, -25.5, -49.4)
    const d2 = haversine(-25.5, -49.4, -25.4284, -49.2733)
    expect(d1).toBeCloseTo(d2, 5)
  })
})
