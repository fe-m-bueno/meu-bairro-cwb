// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NeighborhoodLayer } from '../neighborhood-layer'

let clickHandler: (() => void) | null = null

vi.mock('react-leaflet', () => ({
  GeoJSON: ({
    data,
    onEachFeature,
  }: {
    data: GeoJSON.FeatureCollection
    onEachFeature: (feature: GeoJSON.Feature, layer: any) => void
  }) => {
    useEffect(() => {
      const layer = {
        bindTooltip: vi.fn(),
        on: (handlers: Record<string, () => void>) => {
          clickHandler = handlers.click
        },
        setStyle: vi.fn(),
        bringToFront: vi.fn(),
        options: {},
      }

      if (data.features[0]) {
        onEachFeature(data.features[0], layer)
      }
    }, [])

    return null
  },
  useMap: () => ({
    getPane: () => ({}),
  }),
}))

const bairros = [
  {
    codigo: '41',
    nome: 'Batel',
    nmRegional: 'Matriz',
    cdRegional: '1',
    geometry: {
      type: 'Polygon' as const,
      coordinates: [],
    },
    centroid: [-25.43, -49.27] as [number, number],
  },
]

const scores = [
  {
    bairroCode: '41',
    overall: 80,
    label: 'Muito bom',
    color: '#22c55e',
    rank: 1,
    percentile: 99,
    categories: {
      saude: { category: 'saude', score: 80, factors: [] },
      educacao: { category: 'educacao', score: 80, factors: [] },
      seguranca: { category: 'seguranca', score: 80, factors: [] },
      transporte: { category: 'transporte', score: 80, factors: [] },
      areasVerdes: { category: 'areasVerdes', score: 80, factors: [] },
      cultura: { category: 'cultura', score: 80, factors: [] },
      diversidade: { category: 'diversidade', score: 80, factors: [] },
    },
  },
]

describe('NeighborhoodLayer', () => {
  it('uses the latest onSelectBairro callback for existing map layers', () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()

    const { rerender } = render(
      <NeighborhoodLayer
        bairros={bairros}
        scores={scores}
        onSelectBairro={firstHandler}
      />,
    )

    rerender(
      <NeighborhoodLayer
        bairros={bairros}
        scores={scores}
        onSelectBairro={secondHandler}
      />,
    )

    clickHandler?.()

    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledWith('41')
  })
})
