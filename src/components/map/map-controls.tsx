'use client'

import { useState } from 'react'

interface MapControlsProps {
  visibleLayers: Set<string>
  onToggleLayer: (category: string) => void
}

const CATEGORIES = [
  { key: 'saude', label: 'Saúde', color: '#ef4444' },
  { key: 'educacao', label: 'Educação', color: '#3b82f6' },
  { key: 'seguranca', label: 'Segurança', color: '#f59e0b' },
  { key: 'transporte', label: 'Transporte', color: '#8b5cf6' },
  { key: 'cultura', label: 'Cultura & Esporte', color: '#ec4899' },
]

export function MapControls({
  visibleLayers,
  onToggleLayer,
}: MapControlsProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="absolute top-4 right-4 z-[1000] rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg"
      style={{ minWidth: '180px' }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
      >
        <span>Camadas</span>
        <span className="text-zinc-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-700 px-3 py-2 flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.key}
              className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200 hover:text-zinc-100"
            >
              <input
                type="checkbox"
                checked={visibleLayers.has(cat.key)}
                onChange={() => onToggleLayer(cat.key)}
                className="sr-only"
              />
              <span
                className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-zinc-600"
                style={{
                  backgroundColor: visibleLayers.has(cat.key)
                    ? cat.color
                    : 'transparent',
                  borderColor: cat.color,
                }}
              />
              {cat.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
