import { describe, expect, it } from 'vitest'
import type { ServiceFacility } from '@/lib/types'
import { getRenderableFacilities } from '../renderable-facilities'

function makeFacility(
  id: string,
  subcategory: string,
  coordinates: [number, number],
): ServiceFacility {
  return {
    id,
    name: `${subcategory} ${id}`,
    category: 'transporte',
    subcategory,
    coordinates,
    layerId: 1,
  }
}

describe('getRenderableFacilities', () => {
  it('keeps all terminals and limits paradas independently', () => {
    const facilities = [
      makeFacility('terminal-1', 'Terminal', [-25.43, -49.27]),
      ...Array.from({ length: 5 }, (_, index) =>
        makeFacility(`parada-${index + 1}`, 'Parada', [
          -25.43 - index * 0.001,
          -49.27 - index * 0.001,
        ]),
      ),
    ]

    const renderable = getRenderableFacilities('transporte', facilities, null, {
      transporte: { paradas: 2 },
    })

    expect(
      renderable.filter((item) => item.subcategory === 'Terminal'),
    ).toHaveLength(1)
    expect(
      renderable.filter((item) => item.subcategory === 'Parada'),
    ).toHaveLength(2)
  })

  it('prioritizes nearest paradas when a bairro is selected', () => {
    const facilities = [
      makeFacility('terminal-1', 'Terminal', [-25.43, -49.27]),
      makeFacility('near', 'Parada', [-25.4301, -49.2701]),
      makeFacility('mid', 'Parada', [-25.431, -49.271]),
      makeFacility('far', 'Parada', [-25.45, -49.29]),
    ]

    const renderable = getRenderableFacilities(
      'transporte',
      facilities,
      [-25.43, -49.27],
      {
        transporte: { paradas: 2 },
      },
    )

    expect(renderable.map((item) => item.id)).toContain('near')
    expect(renderable.map((item) => item.id)).toContain('mid')
    expect(renderable.map((item) => item.id)).not.toContain('far')
  })
})
