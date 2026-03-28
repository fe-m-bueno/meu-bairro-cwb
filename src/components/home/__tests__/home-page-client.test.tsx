// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePageClient } from '../home-page-client'

const replace = vi.fn()
let mockedSearchParams = new URLSearchParams('bairro=100')
let mockedPathname = '/'

vi.mock('next/dynamic', () => ({
  default: () => function MockCityMap() {
    return <div data-testid="city-map" />
  },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useRouter: () => ({
    replace,
  }),
  useSearchParams: () => mockedSearchParams,
}))

vi.mock('@/components/layout/map-footer', () => ({
  MapFooter: () => <div data-testid="map-footer" />,
}))

vi.mock('@/components/map/map-controls', () => ({
  MapControls: () => <div data-testid="map-controls" />,
}))

vi.mock('@/components/search/address-search', () => ({
  AddressSearch: () => <div data-testid="address-search" />,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/panel/compare-panel', () => ({
  ComparePanel: () => <div data-testid="compare-panel" />,
}))

vi.mock('@/components/panel/neighborhood-panel', () => ({
  NeighborhoodPanel: ({
    bairro,
    onStartCompare,
  }: {
    bairro: { nome: string }
    onStartCompare?: () => void
  }) => (
    <div data-testid="neighborhood-panel">
      <span>{bairro.nome}</span>
      <button type="button" onClick={onStartCompare}>
        Comparar com outro bairro
      </button>
    </div>
  ),
}))

const data = {
  bairros: [
    {
      codigo: '100',
      nome: 'Centro',
      nmRegional: 'Matriz',
      cdRegional: '1',
      geometry: {
        type: 'Polygon' as const,
        coordinates: [],
      },
      centroid: [-25.43, -49.27] as [number, number],
    },
  ],
  scores: [
    {
      bairroCode: '100',
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
  ],
  cityAverage: null,
  services: {},
  serviceCounts: {},
  transportMeta: {
    total: 0,
    paradas: 0,
    terminais: 0,
  },
}

describe('HomePageClient compare selection mode', () => {
  beforeEach(() => {
    replace.mockReset()
    mockedSearchParams = new URLSearchParams('bairro=100')
    mockedPathname = '/'
  })

  it('navigates to pending compare-selection URL after starting compare', () => {
    render(<HomePageClient data={data} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Comparar com outro bairro' }),
    )

    expect(replace).toHaveBeenCalledWith('/?bairro=100&compareMode=select', {
      scroll: false,
    })
  })

  it('renders a clear versus selection state while waiting for the second bairro', () => {
    mockedSearchParams = new URLSearchParams('bairro=100&compareMode=select')

    render(<HomePageClient data={data} />)

    expect(screen.getByText('Modo de comparação')).toBeDefined()
    expect(screen.getByText('Centro')).toBeDefined()
    expect(screen.getByText('VS')).toBeDefined()
    expect(screen.getByText('Selecione outro bairro no mapa')).toBeDefined()
    expect(
      screen.getByText(
        'Clique em um segundo bairro no mapa para abrir o duelo lado a lado.',
      ),
    ).toBeDefined()
  })

  it('normalizes legacy pathname compare-selection URLs', () => {
    mockedSearchParams = new URLSearchParams()
    mockedPathname = '/bairro=100&compareMode=select'

    render(<HomePageClient data={data} />)

    expect(replace).toHaveBeenCalledWith('/?bairro=100&compareMode=select', {
      scroll: false,
    })
  })
})
