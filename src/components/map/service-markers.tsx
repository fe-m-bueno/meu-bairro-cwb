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

const MAX_TRANSPORT_PARADAS = 500

export function ServiceMarkers({
  services,
  visibleLayers,
}: ServiceMarkersProps) {
  return (
    <>
      {Object.entries(services).map(([category, facilities]) => {
        if (!visibleLayers.has(category)) return null

        const color = CATEGORY_COLORS[category] ?? '#6b7280'

        let renderFacilities = facilities
        if (category === 'transporte') {
          const paradas = facilities.filter((f) => f.subcategory === 'Parada')
          const nonParadas = facilities.filter(
            (f) => f.subcategory !== 'Parada',
          )
          const paradaSubset = paradas.slice(0, MAX_TRANSPORT_PARADAS)
          renderFacilities = [...nonParadas, ...paradaSubset]
        }

        return renderFacilities.map((facility) => (
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
