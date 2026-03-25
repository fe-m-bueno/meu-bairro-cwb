import { describe, expect, it } from 'vitest'
import { calculateCentroid } from '../centroid'

describe('calculateCentroid', () => {
  it('calculates centroid of a simple square Polygon', () => {
    // Square centered at lng=-49, lat=-25 (GeoJSON: [lng, lat])
    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [-49.1, -25.1],
          [-48.9, -25.1],
          [-48.9, -24.9],
          [-49.1, -24.9],
          [-49.1, -25.1], // closing point
        ],
      ],
    }
    const [lat, lng] = calculateCentroid(polygon)
    expect(lat).toBeCloseTo(-25.0, 5)
    expect(lng).toBeCloseTo(-49.0, 5)
  })

  it('calculates centroid of a MultiPolygon', () => {
    // Two squares, one centered at (-25, -49) and one at (-26, -50)
    const multiPolygon: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [-49.1, -25.1],
            [-48.9, -25.1],
            [-48.9, -24.9],
            [-49.1, -24.9],
            [-49.1, -25.1],
          ],
        ],
        [
          [
            [-50.1, -26.1],
            [-49.9, -26.1],
            [-49.9, -25.9],
            [-50.1, -25.9],
            [-50.1, -26.1],
          ],
        ],
      ],
    }
    const [lat, lng] = calculateCentroid(multiPolygon)
    // Average centroid of the two squares
    expect(lat).toBeCloseTo(-25.5, 1)
    expect(lng).toBeCloseTo(-49.5, 1)
  })

  it('returns [lat, lng] order (not [lng, lat])', () => {
    // Polygon clearly in southern hemisphere (lat < 0) and western hemisphere (lng < 0)
    // lat ~= -25, lng ~= -49
    const polygon: GeoJSON.Polygon = {
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
    const [first, second] = calculateCentroid(polygon)
    // first should be lat (~-25), second should be lng (~-49)
    expect(first).toBeCloseTo(-25.0, 1)
    expect(second).toBeCloseTo(-49.0, 1)
  })
})
