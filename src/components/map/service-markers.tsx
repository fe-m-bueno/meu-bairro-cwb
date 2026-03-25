'use client'

import { CircleMarker, Popup } from 'react-leaflet'
import type { ServiceFacility } from '@/lib/types'

interface ServiceMarkersProps {
  services: Record<string, ServiceFacility[]>
  visibleLayers: Set<string>
}

const CATEGORY_COLORS: Record<string, string> = {
  saude: '#ef4444',
  educacao: '#3b82f6',
  seguranca: '#f59e0b',
  transporte: '#8b5cf6',
  cultura: '#ec4899',
}

const MAX_MARKERS_PER_CATEGORY: Record<string, number> = {
  saude: 200,
  educacao: 200,
  seguranca: 100,
  transporte: 300,
  cultura: 150,
}

const MAX_TOTAL_MARKERS = 500
const DEFAULT_CAP = 100

export function ServiceMarkers({
  services,
  visibleLayers,
}: ServiceMarkersProps) {
  // Calculate how many categories are visible and budget markers accordingly
  const visibleCategories = Object.keys(services).filter((cat) =>
    visibleLayers.has(cat),
  )

  let totalBudget = MAX_TOTAL_MARKERS
  const renderGroups: { category: string; facilities: ServiceFacility[] }[] = []

  for (const category of visibleCategories) {
    const facilities = services[category] ?? []
    const categoryCap = MAX_MARKERS_PER_CATEGORY[category] ?? DEFAULT_CAP
    const cap = Math.min(categoryCap, totalBudget)
    if (cap <= 0) break

    const capped = facilities.slice(0, cap)
    renderGroups.push({ category, facilities: capped })
    totalBudget -= capped.length
  }

  return (
    <>
      {renderGroups.map(({ category, facilities }) => {
        const color = CATEGORY_COLORS[category] ?? '#6b7280'

        return facilities.map((facility) => (
          <CircleMarker
            key={facility.id}
            center={[facility.coordinates[0], facility.coordinates[1]]}
            radius={4}
            weight={1}
            color={color}
            fillColor={color}
            fillOpacity={0.8}
          >
            <Popup>
              <strong>{facility.name}</strong>
              <br />
              <span>{facility.subcategory}</span>
            </Popup>
          </CircleMarker>
        ))
      })}
    </>
  )
}
