'use client'

import { useMemo } from 'react'
import { CATEGORY_NAMES } from '@/components/panel/category-card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { haversine } from '@/lib/geo/haversine'
import { calculateCentroid } from '@/lib/geo/centroid'
import { findWithinRadius } from '@/lib/geo/nearest'
import { getScoreLabel } from '@/lib/score/weights'
import type {
  BairroCrimeData,
  Bairro,
  CategoryKey,
  CategoryScore,
  GreenArea,
  ServiceFacility,
} from '@/lib/types'

interface CategoryDetailModalProps {
  open: boolean
  onClose: () => void
  bairro: Bairro
  categoryKey: CategoryKey
  categoryScore: CategoryScore
  services: Record<string, ServiceFacility[]>
  greenAreas: GreenArea[]
  crimeData: BairroCrimeData | undefined
}

const CATEGORY_ICONS: Record<CategoryKey, string> = {
  saude: '🏥',
  educacao: '🎓',
  seguranca: '🛡️',
  transporte: '🚌',
  areasVerdes: '🌳',
  cultura: '🎭',
  diversidade: '🔀',
}

const LAYER_TYPE_NAMES: Record<number, string> = {
  1: 'Estação Ecológica',
  2: 'Parque Natural',
  3: 'Parque Linear',
  4: 'Bosque Municipal',
  5: 'Bosque de Conservação',
  6: 'Refúgio da Vida Silvestre',
  7: 'RPPNM',
  8: 'Específicas',
  10: 'APA',
  11: 'ARIE',
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function ScoreBar({ score }: { score: number }) {
  const { color } = getScoreLabel(score)
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="min-w-[2rem] text-right text-xs font-semibold tabular-nums"
        style={{ color }}
      >
        {Math.round(score)}
      </span>
    </div>
  )
}

function TendenciaIcon({ tendencia }: { tendencia: BairroCrimeData['tendencia'] }) {
  if (tendencia === 'subindo') {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <title>Subindo</title>
          <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Subindo
      </span>
    )
  }
  if (tendencia === 'descendo') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-500">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <title>Descendo</title>
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Descendo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <title>Estável</title>
        <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Estável
    </span>
  )
}

export function CategoryDetailModal({
  open,
  onClose,
  bairro,
  categoryKey,
  categoryScore,
  services,
  greenAreas,
  crimeData,
}: CategoryDetailModalProps) {
  const { color, label } = getScoreLabel(categoryScore.score)

  const nearbyFacilities = useMemo(() => {
    switch (categoryKey) {
      case 'saude':
        return findWithinRadius(bairro.centroid, services.saude ?? [], 3000).slice(0, 8)
      case 'educacao':
        return findWithinRadius(bairro.centroid, services.educacao ?? [], 2000).slice(0, 8)
      case 'seguranca':
        return findWithinRadius(bairro.centroid, services.seguranca ?? [], 4000).slice(0, 8)
      case 'transporte': {
        const terminals = findWithinRadius(
          bairro.centroid,
          (services.transporte ?? []).filter((f) => f.subcategory === 'Terminal'),
          5000,
        ).slice(0, 4)
        const stops = findWithinRadius(
          bairro.centroid,
          (services.transporte ?? []).filter((f) => f.subcategory !== 'Terminal'),
          1500,
        ).slice(0, 6)
        return [...terminals, ...stops]
      }
      case 'cultura':
        return findWithinRadius(bairro.centroid, services.cultura ?? [], 3000).slice(0, 8)
      default:
        return []
    }
  }, [bairro, categoryKey, services])

  const nearbyGreenAreas = useMemo(() => {
    if (categoryKey !== 'areasVerdes') return []
    return greenAreas
      .map((area) => {
        const centroid = calculateCentroid(area.geometry)
        const distance = haversine(
          bairro.centroid[0],
          bairro.centroid[1],
          centroid[0],
          centroid[1],
        )
        return { area, distance }
      })
      .filter(({ distance }) => distance <= 3000)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
  }, [bairro, categoryKey, greenAreas])

  const categoryName = CATEGORY_NAMES[categoryKey]
  const icon = CATEGORY_ICONS[categoryKey]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <span className="mr-2">{icon}</span>
            Detalhes: {categoryName} — {bairro.nome}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              style={{ backgroundColor: color, color: '#fff', borderColor: color }}
              className="border px-2 py-0.5 text-xs font-semibold"
            >
              {Math.round(categoryScore.score)} — {label}
            </Badge>
            <span className="text-xs text-muted-foreground">{bairro.nmRegional}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

          {/* Crime Stats for Segurança */}
          {categoryKey === 'seguranca' && crimeData && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Dados de Ocorrências</h3>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total de ocorrências (12m)</p>
                    <p className="text-lg font-bold text-foreground">{crimeData.totalOcorrencias12m.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Por km²</p>
                    <p className="text-lg font-bold text-foreground">{crimeData.ocorrenciasPorKm2.toFixed(1)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                  <TendenciaIcon tendencia={crimeData.tendencia} />
                </div>
                {crimeData.topNaturezas.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Principais tipos de ocorrência</p>
                    <ul className="space-y-1">
                      {crimeData.topNaturezas.slice(0, 5).map((n) => (
                        <li key={n.nome} className="flex items-center justify-between text-xs">
                          <span className="text-foreground/80 truncate mr-2">{n.nome}</span>
                          <span className="font-medium text-foreground tabular-nums shrink-0">{n.count.toLocaleString('pt-BR')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Factors Section */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Fatores Avaliados</h3>
            <div className="space-y-3">
              {categoryScore.factors.map((factor) => (
                <div key={factor.name} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{factor.name}</p>
                      {factor.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{factor.description}</p>
                      )}
                    </div>
                    {factor.rawValue !== '' && factor.rawValue !== undefined && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {typeof factor.rawValue === 'number'
                          ? Number.isInteger(factor.rawValue)
                            ? factor.rawValue
                            : factor.rawValue.toFixed(1)
                          : factor.rawValue}
                      </span>
                    )}
                  </div>
                  <ScoreBar score={factor.score} />
                </div>
              ))}
            </div>
          </section>

          {/* Diversidade: checklist instead of facility list */}
          {categoryKey === 'diversidade' && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Checklist de Serviços</h3>
              <div className="space-y-2">
                {categoryScore.factors.map((factor) => {
                  const present = factor.score >= 50
                  return (
                    <div
                      key={factor.name}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 border border-border bg-muted/20"
                    >
                      <span className={present ? 'text-emerald-500' : 'text-destructive'}>
                        {present ? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                            <title>Presente</title>
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                            <title>Ausente</title>
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 text-xs text-foreground">{factor.name}</span>
                      <span className={`text-xs font-medium ${present ? 'text-emerald-500' : 'text-destructive'}`}>
                        {present ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Nearby Facilities */}
          {categoryKey !== 'diversidade' && categoryKey !== 'areasVerdes' && nearbyFacilities.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Equipamentos Próximos
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({nearbyFacilities.length} encontrados)
                </span>
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border border-border bg-muted/10 p-2">
                {nearbyFacilities.map(({ facility, distance }) => (
                  <div
                    key={facility.id}
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{facility.name}</p>
                      <Badge
                        variant="secondary"
                        className="mt-0.5 text-[10px] px-1.5 py-0 h-4"
                      >
                        {facility.subcategory}
                      </Badge>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground shrink-0 tabular-nums">
                      {formatDistance(distance)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {categoryKey !== 'diversidade' && categoryKey !== 'areasVerdes' && nearbyFacilities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum equipamento encontrado na área de busca.
            </p>
          )}

          {/* Green Areas */}
          {categoryKey === 'areasVerdes' && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Áreas Verdes Próximas
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({nearbyGreenAreas.length} encontradas em até 3km)
                </span>
              </h3>
              {nearbyGreenAreas.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border border-border bg-muted/10 p-2">
                  {nearbyGreenAreas.map(({ area, distance }) => {
                    const typeName = LAYER_TYPE_NAMES[area.layerId] ?? area.type
                    return (
                      <div
                        key={area.id}
                        className="flex items-center gap-2 rounded-md px-2.5 py-2 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{area.name}</p>
                          <Badge
                            variant="secondary"
                            className="mt-0.5 text-[10px] px-1.5 py-0 h-4"
                          >
                            {typeName}
                          </Badge>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground shrink-0 tabular-nums">
                          {formatDistance(distance)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma área verde encontrada em até 3km.
                </p>
              )}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
