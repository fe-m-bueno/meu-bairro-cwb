'use client'

import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import type {
  Bairro,
  BairroScore,
  CategoryKey,
  ServiceFacility,
} from '@/lib/types'
import { CATEGORY_NAMES, CategoryCard } from './category-card'
import { NearbyServices } from './nearby-services'
import { RadarChart } from './radar-chart'
import { ScoreGauge } from './score-gauge'
import { StrengthsWeaknesses } from './strengths-weaknesses'

const CATEGORY_ICONS: Record<CategoryKey, string> = {
  saude: '\u{1FA7A}',
  educacao: '\u{1F393}',
  seguranca: '\u{1F6E1}\uFE0F',
  transporte: '\u{1F68C}',
  areasVerdes: '\u{1F333}',
  cultura: '\u{1F3AD}',
  diversidade: '\u{2B50}',
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

interface NeighborhoodPanelProps {
  bairro: Bairro
  score: BairroScore
  cityAverage: Record<string, number> | null
  services: Record<string, ServiceFacility[]>
  onClose: () => void
  onStartCompare?: () => void
}

function PanelContent({
  bairro,
  score,
  cityAverage,
  services,
  onStartCompare,
}: Omit<NeighborhoodPanelProps, 'onClose'>) {
  return (
    <div className="space-y-5 p-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">{bairro.nome}</h2>
        <p className="text-xs text-muted-foreground">{bairro.nmRegional}</p>
      </div>

      <ScoreGauge
        score={score.overall}
        label={score.label}
        color={score.color}
        percentile={score.percentile}
      />

      <Separator />

      <RadarChart categoryScores={score.categories} cityAverage={cityAverage} />

      <Separator />

      <StrengthsWeaknesses categories={score.categories} />

      <Separator />

      <div className="space-y-1">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categorias
        </h3>
        {CATEGORY_ORDER.map((key) => (
          <CategoryCard
            key={key}
            categoryScore={score.categories[key]}
            categoryName={CATEGORY_NAMES[key]}
            icon={CATEGORY_ICONS[key]}
          />
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Equipamentos próximos
        </h3>
        <NearbyServices centroid={bairro.centroid} services={services} />
      </div>

      {onStartCompare && (
        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={onStartCompare}
            className="w-full cursor-pointer rounded-lg border border-emerald-600 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
          >
            Comparar com outro bairro
          </button>
        </div>
      )}
    </div>
  )
}

export function NeighborhoodPanel({
  bairro,
  score,
  cityAverage,
  services,
  onClose,
  onStartCompare,
}: NeighborhoodPanelProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetTitle className="sr-only">{bairro.nome}</SheetTitle>
          <SheetDescription className="sr-only">
            Detalhes do bairro {bairro.nome}
          </SheetDescription>
          <ScrollArea className="h-full max-h-[80vh]">
            <PanelContent
              bairro={bairro}
              score={score}
              cityAverage={cityAverage}
              services={services}
              onStartCompare={onStartCompare}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="fixed top-14 right-0 z-[1001] flex h-[calc(100vh-3.5rem)] w-[380px] flex-col border-l border-border bg-background/95 backdrop-blur-sm transition-transform duration-300">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          {bairro.nome}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Fechar painel"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
            role="img"
          >
            <title>Fechar</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <ScrollArea className="flex-1 overflow-y-auto">
        <PanelContent
          bairro={bairro}
          score={score}
          cityAverage={cityAverage}
          services={services}
          onStartCompare={onStartCompare}
        />
      </ScrollArea>
    </div>
  )
}
