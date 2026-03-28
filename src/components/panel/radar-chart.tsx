'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { CategoryKey, CategoryScore } from '@/lib/types'

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  saude: 'Saúde',
  educacao: 'Educação',
  seguranca: 'Segurança',
  transporte: 'Transporte',
  areasVerdes: 'Áreas Verdes',
  cultura: 'Cultura',
  diversidade: 'Diversidade',
}

const CATEGORY_ORDER: CategoryKey[] = [
  'saude',
  'educacao',
  'seguranca',
  'transporte',
  'areasVerdes',
  'cultura',
  'diversidade',
]

interface RadarChartProps {
  categoryScores: Record<CategoryKey, CategoryScore>
  cityAverage: Record<string, number> | null
}

export function RadarChart({ categoryScores, cityAverage }: RadarChartProps) {
  const data = CATEGORY_ORDER.map((key) => ({
    category: CATEGORY_LABELS[key],
    bairro: Math.round(categoryScores[key].score),
    media: cityAverage ? Math.round(cityAverage[key] ?? 0) : 0,
  }))

  return (
    <div className="min-h-[260px] min-w-0 w-full" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(100,160,120,0.2)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#8a9a8e', fontSize: 11 }}
          />
          {cityAverage && (
            <Radar
              name="Média"
              dataKey="media"
              stroke="#8a9a8e"
              fill="#8a9a8e"
              fillOpacity={0.1}
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          )}
          <Radar
            name="Bairro"
            dataKey="bairro"
            stroke="#2d8a5e"
            fill="#2d8a5e"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
