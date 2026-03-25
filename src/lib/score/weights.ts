import type { CategoryKey, ScoreLabel } from '@/lib/types'

export const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  saude: 0.2,
  educacao: 0.18,
  seguranca: 0.17,
  transporte: 0.18,
  areasVerdes: 0.12,
  cultura: 0.08,
  diversidade: 0.07,
}

export const SCORE_LABELS: ScoreLabel[] = [
  { label: 'Excelente', color: '#10b981', min: 85, max: 100 },
  { label: 'Muito Bom', color: '#22c55e', min: 70, max: 84 },
  { label: 'Bom', color: '#84cc16', min: 55, max: 69 },
  { label: 'Regular', color: '#eab308', min: 40, max: 54 },
  { label: 'Abaixo da Média', color: '#f97316', min: 25, max: 39 },
  { label: 'Crítico', color: '#ef4444', min: 0, max: 24 },
]

export function getScoreLabel(score: number): ScoreLabel {
  const clamped = Math.round(Math.max(0, Math.min(100, score)))
  return (
    SCORE_LABELS.find((l) => clamped >= l.min && clamped <= l.max) ??
    SCORE_LABELS[SCORE_LABELS.length - 1]
  )
}
