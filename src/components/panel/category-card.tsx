'use client'

import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { getScoreLabel } from '@/lib/score/weights'
import type { CategoryKey, CategoryScore } from '@/lib/types'

export const CATEGORY_NAMES: Record<CategoryKey, string> = {
  saude: 'Saúde',
  educacao: 'Educação',
  seguranca: 'Segurança',
  transporte: 'Transporte',
  areasVerdes: 'Áreas Verdes',
  cultura: 'Cultura & Esporte',
  diversidade: 'Diversidade',
}

interface CategoryCardProps {
  categoryScore: CategoryScore
  categoryName: string
  icon?: string
}

export function CategoryCard({
  categoryScore,
  categoryName,
  icon,
}: CategoryCardProps) {
  const [open, setOpen] = useState(false)
  const { color } = getScoreLabel(categoryScore.score)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-800/50">
        {icon && <span className="text-base">{icon}</span>}
        <span className="flex-1 text-sm font-medium text-zinc-200">
          {categoryName}
        </span>
        <span
          className="min-w-[2.5rem] text-right text-sm font-semibold tabular-nums"
          style={{ color }}
        >
          {Math.round(categoryScore.score)}
        </span>
        <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${categoryScore.score}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <svg
          className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          role="img"
        >
          <title>Expandir</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-2">
        <div className="mt-1 space-y-1.5">
          {categoryScore.factors.map((factor) => {
            const factorColor = getScoreLabel(factor.score).color
            return (
              <div
                key={factor.name}
                className="flex items-center gap-2 rounded-md bg-zinc-900/50 px-2.5 py-1.5 text-xs"
              >
                <span className="flex-1 text-zinc-400">{factor.name}</span>
                <span className="text-zinc-300">{factor.description}</span>
                <span
                  className="min-w-[1.75rem] text-right font-semibold tabular-nums"
                  style={{ color: factorColor }}
                >
                  {Math.round(factor.score)}
                </span>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
