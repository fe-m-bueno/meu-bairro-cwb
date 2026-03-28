import { haversine } from '@/lib/geo/haversine'
import type { ServiceFacility } from '@/lib/types'

export interface TransportRenderCap {
  paradas: number
}

export type RenderCaps = Partial<Record<string, number | TransportRenderCap>>

export const DEFAULT_RENDER_CAPS: RenderCaps = {
  saude: 200,
  educacao: 200,
  seguranca: 100,
  transporte: { paradas: 280 },
  cultura: 150,
}

function getNumericCap(value: number | TransportRenderCap | undefined): number {
  return typeof value === 'number' ? value : Number.POSITIVE_INFINITY
}

export function getRenderableFacilities(
  category: string,
  facilities: ServiceFacility[],
  selectedCentroid: [number, number] | null,
  caps: RenderCaps = DEFAULT_RENDER_CAPS,
): ServiceFacility[] {
  if (category !== 'transporte') {
    return facilities.slice(0, getNumericCap(caps[category]))
  }

  const transportCap = caps.transporte
  const paradaCap =
    typeof transportCap === 'object' ? transportCap.paradas : facilities.length

  const terminals = facilities.filter(
    (facility) => facility.subcategory === 'Terminal',
  )
  const stops = facilities.filter(
    (facility) => facility.subcategory !== 'Terminal',
  )

  const sortedStops =
    selectedCentroid == null
      ? stops
      : [...stops].sort((a, b) => {
          const distanceA = haversine(
            selectedCentroid[0],
            selectedCentroid[1],
            a.coordinates[0],
            a.coordinates[1],
          )
          const distanceB = haversine(
            selectedCentroid[0],
            selectedCentroid[1],
            b.coordinates[0],
            b.coordinates[1],
          )
          return distanceA - distanceB
        })

  return [...terminals, ...sortedStops.slice(0, paradaCap)]
}
