// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ComparePanel } from '../compare-panel'

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../compare-view', () => ({
  CompareView: ({
    bairroA,
    bairroB,
  }: {
    bairroA: { nome: string }
    bairroB: { nome: string }
  }) => <div>{`${bairroA.nome} versus ${bairroB.nome}`}</div>,
}))

const bairroA = {
  codigo: '100',
  nome: 'Centro',
  nmRegional: 'Matriz',
  cdRegional: '1',
  geometry: {
    type: 'Polygon' as const,
    coordinates: [],
  },
  centroid: [-25.43, -49.27] as [number, number],
}

const bairroB = {
  ...bairroA,
  codigo: '200',
  nome: 'Batel',
}

const score = {
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
}

describe('ComparePanel', () => {
  it('renders an explicit versus header', () => {
    render(
      <ComparePanel
        bairroA={bairroA}
        scoreA={score}
        bairroB={bairroB}
        scoreB={{ ...score, bairroCode: '200' }}
        cityAverage={null}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Modo versus')).toBeDefined()
    expect(screen.getByText('Centro')).toBeDefined()
    expect(screen.getByText('VS')).toBeDefined()
    expect(screen.getByText('Batel')).toBeDefined()
    expect(screen.getByText('Comparação direta entre os dois bairros selecionados.')).toBeDefined()
  })
})
