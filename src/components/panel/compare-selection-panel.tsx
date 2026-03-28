'use client'

import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Bairro } from '@/lib/types'

interface CompareSelectionPanelProps {
  bairro: Bairro
  onClose: () => void
}

function CompareSelectionContent({
  bairro,
  onClose,
}: CompareSelectionPanelProps) {
  return (
    <div className="space-y-5 p-4">
      <div className="space-y-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4">
        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Modo de comparação
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Bairro base
            </div>
            <div className="truncate text-sm font-semibold text-foreground">
              {bairro.nome}
            </div>
          </div>
          <div className="text-sm font-black tracking-[0.28em] text-emerald-400">
            VS
          </div>
          <div className="min-w-0 rounded-xl border border-dashed border-emerald-500/35 bg-background px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.24em] text-emerald-300/80">
              Selecione outro bairro no mapa
            </div>
            <div className="truncate text-sm font-semibold text-foreground/75">
              ?
            </div>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Clique em um segundo bairro no mapa para abrir o duelo lado a lado.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          O que acontece agora
        </h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. O bairro atual fica travado como referência.</li>
          <li>2. Seu próximo clique no mapa escolhe o rival.</li>
          <li>3. A tela muda para um comparativo direto em modo versus.</li>
        </ol>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full cursor-pointer rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        Cancelar comparação
      </button>
    </div>
  )
}

export function CompareSelectionPanel({
  bairro,
  onClose,
}: CompareSelectionPanelProps) {
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
          <SheetTitle className="sr-only">Selecionando bairro para comparar</SheetTitle>
          <SheetDescription className="sr-only">
            Escolha um segundo bairro para comparar com {bairro.nome}
          </SheetDescription>
          <ScrollArea className="h-full max-h-[80vh]">
            <CompareSelectionContent bairro={bairro} onClose={onClose} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="fixed top-14 right-0 z-[1001] flex h-[calc(100vh-3.5rem)] w-[380px] flex-col border-l border-border bg-background/95 backdrop-blur-sm">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Selecionando rival
            </div>
            <div className="text-xs text-muted-foreground">
              Escolha o segundo bairro no mapa
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Cancelar comparação"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <title>Cancelar</title>
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
        <CompareSelectionContent bairro={bairro} onClose={onClose} />
      </ScrollArea>
    </div>
  )
}
