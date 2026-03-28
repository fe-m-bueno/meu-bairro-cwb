// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RadarChart } from '../radar-chart'

vi.mock('recharts', () => ({
  PolarAngleAxis: () => null,
  PolarGrid: () => null,
  Radar: () => null,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

const categoryScores = {
  saude: { category: 'saude', score: 80, factors: [] },
  educacao: { category: 'educacao', score: 70, factors: [] },
  seguranca: { category: 'seguranca', score: 60, factors: [] },
  transporte: { category: 'transporte', score: 90, factors: [] },
  areasVerdes: { category: 'areasVerdes', score: 50, factors: [] },
  cultura: { category: 'cultura', score: 65, factors: [] },
  diversidade: { category: 'diversidade', score: 75, factors: [] },
} as const

describe('RadarChart', () => {
  it('renders inside a container with explicit minimum dimensions', () => {
    const { container } = render(
      <RadarChart categoryScores={categoryScores} cityAverage={null} />,
    )

    const chartContainer = container.firstElementChild

    expect(chartContainer?.className).toContain('min-w-0')
    expect(chartContainer?.className).toContain('min-h-[260px]')
  })
})
