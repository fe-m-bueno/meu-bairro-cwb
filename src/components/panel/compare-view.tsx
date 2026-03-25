'use client'

import type { Bairro, BairroScore, CategoryKey } from '@/lib/types'
import { CATEGORY_NAMES } from './category-card'
import { RadarChart } from './radar-chart'
import { ScoreGauge } from './score-gauge'

interface CompareViewProps {
  bairroA: Bairro
  scoreA: BairroScore
  bairroB: Bairro
  scoreB: BairroScore
  cityAverage: Record<string, number> | null
}

const ALL_CATEGORIES: CategoryKey[] = [
  'saude',
  'educacao',
  'seguranca',
  'transporte',
  'areasVerdes',
  'cultura',
  'diversidade',
]

export function CompareView({
  bairroA,
  scoreA,
  bairroB,
  scoreB,
  cityAverage: _cityAverage,
}: CompareViewProps) {
  void _cityAverage
  const winsA = ALL_CATEGORIES.filter(
    (k) => scoreA.categories[k].score > scoreB.categories[k].score,
  ).length
  const winsB = ALL_CATEGORIES.filter(
    (k) => scoreB.categories[k].score > scoreA.categories[k].score,
  ).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-sm font-semibold text-zinc-200">
            {bairroA.nome}
          </h3>
          <ScoreGauge
            score={scoreA.overall}
            label={scoreA.label}
            color={scoreA.color}
            percentile={scoreA.percentile}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-sm font-semibold text-zinc-200">
            {bairroB.nome}
          </h3>
          <ScoreGauge
            score={scoreB.overall}
            label={scoreB.label}
            color={scoreB.color}
            percentile={scoreB.percentile}
          />
        </div>
      </div>

      <RadarChart
        categoryScores={scoreA.categories}
        cityAverage={Object.fromEntries(
          ALL_CATEGORIES.map((k) => [k, scoreB.categories[k].score]),
        )}
      />

      <div className="space-y-1.5">
        {ALL_CATEGORIES.map((key) => {
          const a = scoreA.categories[key].score
          const b = scoreB.categories[key].score
          const diff = a - b
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-md bg-zinc-900/50 px-2.5 py-1.5 text-xs"
            >
              <span className="flex-1 text-zinc-300">
                {CATEGORY_NAMES[key]}
              </span>
              <span className="w-8 text-right tabular-nums text-zinc-400">
                {Math.round(a)}
              </span>
              <span
                className={`w-10 text-center text-[10px] font-semibold ${
                  diff > 0
                    ? 'text-emerald-400'
                    : diff < 0
                      ? 'text-orange-400'
                      : 'text-zinc-500'
                }`}
              >
                {diff > 0
                  ? `+${Math.round(diff)}`
                  : diff < 0
                    ? Math.round(diff)
                    : '='}
              </span>
              <span className="w-8 text-right tabular-nums text-zinc-400">
                {Math.round(b)}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-zinc-400">
        {winsA > winsB
          ? `${bairroA.nome} é melhor em ${winsA}/7 categorias`
          : winsB > winsA
            ? `${bairroB.nome} é melhor em ${winsB}/7 categorias`
            : 'Empate entre os bairros'}
      </p>
    </div>
  )
}
