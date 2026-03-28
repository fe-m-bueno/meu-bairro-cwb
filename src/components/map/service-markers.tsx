'use client'

import type L from 'leaflet'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import { haversine } from '@/lib/geo/haversine'
import type { ServiceFacility } from '@/lib/types'
import { getFacilityIcon } from './marker-icons'
import {
  DEFAULT_RENDER_CAPS,
  getFacilityMarkerKey,
  getRenderableFacilities,
} from './renderable-facilities'

interface ServiceMarkersProps {
  services: Record<string, ServiceFacility[]>
  visibleLayers: Set<string>
  selectedCentroid?: [number, number] | null
}

const CATEGORY_LABELS: Record<string, string> = {
  saude: 'Saúde',
  educacao: 'Educação',
  seguranca: 'Segurança',
  transporte: 'Transporte',
  cultura: 'Cultura & Esporte',
}

const CATEGORY_COLORS: Record<string, string> = {
  saude: '#ef4444',
  educacao: '#3b82f6',
  seguranca: '#f59e0b',
  transporte: '#8b5cf6',
  cultura: '#ec4899',
}

function formatDist(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function ServiceMarkers({
  services,
  visibleLayers,
  selectedCentroid,
}: ServiceMarkersProps) {
  const visibleCategories = Object.keys(services).filter((cat) =>
    visibleLayers.has(cat),
  )
  const renderGroups = visibleCategories.map((category) => ({
    category,
    facilities: getRenderableFacilities(
      category,
      services[category] ?? [],
      selectedCentroid ?? null,
      DEFAULT_RENDER_CAPS,
    ),
  }))

  return (
    <>
      {renderGroups.map(({ category, facilities }) => {
        const color = CATEGORY_COLORS[category] ?? '#6b7280'

        return facilities.map((facility) => {
          const icon = getFacilityIcon(category, facility.subcategory)
          const dist =
            selectedCentroid != null
              ? haversine(
                  selectedCentroid[0],
                  selectedCentroid[1],
                  facility.coordinates[0],
                  facility.coordinates[1],
                )
              : null

          // Build tooltip content with specific subcategory info
          const tooltipLabel =
            category === 'transporte' && facility.subcategory === 'Parada'
              ? facility.name
              : `${facility.name}`

          // Build popup content
          const props = facility.properties ?? {}
          const address =
            (props.ds_endereco as string) ??
            (props.endereco as string) ??
            (props.nm_endereco as string) ??
            null
          const lineInfo =
            category === 'transporte' && facility.subcategory === 'Parada'
              ? ((props.nr_linha as string) ?? null)
              : null

          return (
            <Marker
              key={getFacilityMarkerKey(category, facility)}
              position={[facility.coordinates[0], facility.coordinates[1]]}
              icon={icon}
              eventHandlers={{
                mouseover: (e) => {
                  const el = (e.target as L.Marker).getElement()
                  const inner = el?.querySelector(
                    '.category-marker',
                  ) as HTMLElement | null
                  if (inner) {
                    inner.style.transform = 'scale(1.35)'
                    inner.style.transition =
                      'transform 0.15s ease, box-shadow 0.15s ease'
                    inner.style.boxShadow = `0 4px 12px ${color}80`
                  }
                },
                mouseout: (e) => {
                  const el = (e.target as L.Marker).getElement()
                  const inner = el?.querySelector(
                    '.category-marker',
                  ) as HTMLElement | null
                  if (inner) {
                    inner.style.transform = 'scale(1)'
                    inner.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
                  }
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -16]}>
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>
                    {tooltipLabel}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      opacity: 0.75,
                      marginTop: '2px',
                    }}
                  >
                    {CATEGORY_LABELS[category] || category} —{' '}
                    {facility.subcategory}
                  </div>
                  {dist != null && (
                    <div
                      style={{
                        fontSize: '11px',
                        opacity: 0.6,
                        marginTop: '2px',
                      }}
                    >
                      {formatDist(dist)} do bairro
                    </div>
                  )}
                </div>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: '170px', fontFamily: 'system-ui' }}>
                  {/* Colored header bar */}
                  <div
                    style={{
                      margin: '-10px -12px 10px',
                      padding: '7px 12px',
                      background: color,
                      borderRadius: '6px 6px 0 0',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                      }}
                    >
                      {CATEGORY_LABELS[category] || category}
                    </span>
                  </div>

                  {/* Facility name */}
                  <strong
                    style={{
                      fontSize: '13px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    {facility.name}
                  </strong>

                  {/* Subcategory badge */}
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: `${color}20`,
                      color: color,
                      border: `1px solid ${color}40`,
                      marginBottom: '6px',
                    }}
                  >
                    {facility.subcategory}
                  </span>

                  {/* Distance from selected neighborhood */}
                  {dist != null && (
                    <div
                      style={{
                        fontSize: '12px',
                        opacity: 0.7,
                        marginBottom: '4px',
                      }}
                    >
                      📍 {formatDist(dist)} do bairro selecionado
                    </div>
                  )}

                  {/* Address if available */}
                  {address && (
                    <div
                      style={{
                        fontSize: '11px',
                        opacity: 0.65,
                        marginBottom: '3px',
                      }}
                    >
                      {address}
                    </div>
                  )}

                  {/* Bus line info */}
                  {lineInfo && (
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>
                      Linha: {lineInfo}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })
      })}
    </>
  )
}
