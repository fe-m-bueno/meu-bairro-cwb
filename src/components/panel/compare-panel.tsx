'use client'

import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Bairro, BairroScore } from '@/lib/types'
import { CompareView } from './compare-view'

interface ComparePanelProps {
  bairroA: Bairro
  scoreA: BairroScore
  bairroB: Bairro
  scoreB: BairroScore
  cityAverage: Record<string, number> | null
  onClose: () => void
}

function CompareModeHero({
  bairroA,
  bairroB,
}: Pick<ComparePanelProps, 'bairroA' | 'bairroB'>) {
  return (
    <div className="space-y-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4">
      <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
        Modo versus
      </div>
      <div className="flex items-center gap-2">
        <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
          <div className="truncate text-sm font-semibold text-foreground">
            {bairroA.nome}
          </div>
        </div>
        <div className="text-sm font-black tracking-[0.28em] text-emerald-400">
          VS
        </div>
        <div className="min-w-0 rounded-xl border border-emerald-500/30 bg-background px-3 py-2">
          <div className="truncate text-sm font-semibold text-foreground">
            {bairroB.nome}
          </div>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Comparação direta entre os dois bairros selecionados.
      </p>
    </div>
  )
}

function ComparePanelContent({
  bairroA,
  scoreA,
  bairroB,
  scoreB,
  cityAverage,
}: Omit<ComparePanelProps, 'onClose'>) {
  return (
    <div className="space-y-4 p-4">
      <CompareModeHero bairroA={bairroA} bairroB={bairroB} />
      <CompareView
        bairroA={bairroA}
        scoreA={scoreA}
        bairroB={bairroB}
        scoreB={scoreB}
        cityAverage={cityAverage}
      />
    </div>
  )
}

export function ComparePanel({
  bairroA,
  scoreA,
  bairroB,
  scoreB,
  cityAverage,
  onClose,
}: ComparePanelProps) {
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
          <SheetTitle className="sr-only">Comparando bairros</SheetTitle>
          <SheetDescription className="sr-only">
            Comparacao entre {bairroA.nome} e {bairroB.nome}
          </SheetDescription>
          <ScrollArea className="h-full max-h-[80vh]">
            <ComparePanelContent
              bairroA={bairroA}
              scoreA={scoreA}
              bairroB={bairroB}
              scoreB={scoreB}
              cityAverage={cityAverage}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="fixed top-14 right-0 z-[1001] flex h-[calc(100vh-3.5rem)] w-[400px] flex-col border-l border-border bg-background/95 backdrop-blur-sm">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            Comparação de bairros
          </span>
          <button
            type="button"
            onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Fechar comparação"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
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
      </div>
      <ScrollArea className="flex-1 overflow-y-auto">
        <ComparePanelContent
          bairroA={bairroA}
          scoreA={scoreA}
          bairroB={bairroB}
          scoreB={scoreB}
          cityAverage={cityAverage}
        />
      </ScrollArea>
    </div>
  )
}
