import { describe, expect, it } from 'vitest'
import type { ServiceFacility } from '@/lib/types'
import {
  getFacilityMarkerKey,
  getRenderableFacilities,
} from '../renderable-facilities'

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
  it('renders only terminals for transport markers', () => {
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
    ).toHaveLength(0)
  })

  it('keeps transport rendering stable even when a bairro is selected', () => {
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

    expect(renderable.map((item) => item.id)).toEqual(['terminal-1'])
  })
})

describe('getFacilityMarkerKey', () => {
  it('includes the layer id so transport ids from different layers do not collide', () => {
    const terminal = {
      ...makeFacility('115', 'Terminal', [-25.43, -49.27]),
      layerId: 0,
    }
    const stop = {
      ...makeFacility('115', 'Parada', [-25.4301, -49.2701]),
      layerId: 1,
    }

    expect(getFacilityMarkerKey('transporte', terminal)).toBe(
      'transporte-0-115',
    )
    expect(getFacilityMarkerKey('transporte', stop)).toBe('transporte-1-115')
  })
})
