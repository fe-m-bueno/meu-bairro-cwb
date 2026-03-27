'use client'

import { Badge } from '@/components/ui/badge'
import type { CategoryKey, CategoryScore } from '@/lib/types'
import { CATEGORY_NAMES } from './category-card'

interface StrengthsWeaknessesProps {
  categories: Record<CategoryKey, CategoryScore>
}

export function StrengthsWeaknesses({ categories }: StrengthsWeaknessesProps) {
  const sorted = (Object.values(categories) as CategoryScore[]).sort(
    (a, b) => b.score - a.score,
  )

  const strengths = sorted.slice(0, 2)
  const weaknesses = sorted.slice(-2).reverse()

  const top1 = CATEGORY_NAMES[strengths[0].category]
  const top2 = CATEGORY_NAMES[strengths[1].category]
  const bottom1 = CATEGORY_NAMES[weaknesses[0].category]
  const bottom2 = CATEGORY_NAMES[weaknesses[1].category]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {strengths.map((s) => (
          <Badge
            key={s.category}
            className="bg-primary/15 text-primary ring-1 ring-primary/20"
          >
            + {CATEGORY_NAMES[s.category]}
          </Badge>
        ))}
        {weaknesses.map((w) => (
          <Badge
            key={w.category}
            className="bg-destructive/15 text-destructive ring-1 ring-destructive/20"
          >
            - {CATEGORY_NAMES[w.category]}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Destaque em {top1} e {top2}, mas precisa melhorar {bottom1} e {bottom2}.
      </p>
    </div>
  )
}
