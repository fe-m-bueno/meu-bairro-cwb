'use client'

interface MapControlsProps {
  visibleLayers: Set<string>
  onToggleLayer: (category: string) => void
  markerCounts?: Record<string, number>
}

const CATEGORIES = [
  { key: 'saude', label: 'Saúde', color: '#ef4444' },
  { key: 'educacao', label: 'Educação', color: '#3b82f6' },
  { key: 'seguranca', label: 'Segurança', color: '#f59e0b' },
  { key: 'transporte', label: 'Transporte', color: '#8b5cf6' },
  { key: 'cultura', label: 'Cultura', color: '#ec4899' },
]

export function MapControls({
  visibleLayers,
  onToggleLayer,
  markerCounts,
}: MapControlsProps) {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-1.5 rounded-lg border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur-sm">
      {CATEGORIES.map((cat) => {
        const active = visibleLayers.has(cat.key)
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onToggleLayer(cat.key)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              active
                ? 'text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{
              backgroundColor: active ? `${cat.color}20` : 'transparent',
              border: active
                ? `1px solid ${cat.color}60`
                : '1px solid transparent',
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: cat.color, opacity: active ? 1 : 0.4 }}
            />
            {cat.label}
            {active && markerCounts?.[cat.key] != null && (
              <span className="ml-0.5 text-[10px] opacity-50">
                ({markerCounts[cat.key]})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
