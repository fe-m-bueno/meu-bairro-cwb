'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { findWithinRadius } from '@/lib/geo/nearest'
import type { ServiceFacility } from '@/lib/types'
import { CATEGORY_NAMES } from './category-card'

const CATEGORY_RADIUS: Record<string, number> = {
  saude: 2000,
  educacao: 1500,
  seguranca: 3000,
  transporte: 500,
  areasVerdes: 2000,
  cultura: 2000,
  diversidade: 2000,
}

const INITIAL_SHOW = 5

interface NearbyServicesProps {
  centroid: [number, number]
  services: Record<string, ServiceFacility[]>
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function NearbyServices({ centroid, services }: NearbyServicesProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const categoryKeys = Object.keys(services).filter(
    (k) => services[k].length > 0,
  )

  if (categoryKeys.length === 0) {
    return (
      <p className="px-1 text-xs text-zinc-500">
        Nenhum equipamento encontrado nas proximidades.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {categoryKeys.map((catKey) => {
        const radius = CATEGORY_RADIUS[catKey] ?? 2000
        const nearby = findWithinRadius(centroid, services[catKey], radius)
        if (nearby.length === 0) return null

        const isExpanded = expanded[catKey] ?? false
        const visible = isExpanded ? nearby : nearby.slice(0, INITIAL_SHOW)
        const hasMore = nearby.length > INITIAL_SHOW

        return (
          <div key={catKey} className="space-y-1.5">
            <h4 className="text-xs font-medium text-zinc-300">
              {CATEGORY_NAMES[catKey as keyof typeof CATEGORY_NAMES] ?? catKey}{' '}
              <span className="text-zinc-500">({nearby.length})</span>
            </h4>
            <div className="space-y-1">
              {visible.map((item) => (
                <div
                  key={item.facility.id}
                  className="flex items-center gap-2 rounded-md bg-zinc-900/50 px-2.5 py-1.5 text-xs"
                >
                  <span className="flex-1 truncate text-zinc-300">
                    {item.facility.name}
                  </span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {item.facility.subcategory}
                  </Badge>
                  <span className="shrink-0 tabular-nums text-zinc-500">
                    {formatDistance(item.distance)}
                  </span>
                </div>
              ))}
            </div>
            {hasMore && !isExpanded && (
              <button
                type="button"
                className="text-xs text-emerald-400 hover:text-emerald-300"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [catKey]: true }))
                }
              >
                ver mais ({nearby.length - INITIAL_SHOW})
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
