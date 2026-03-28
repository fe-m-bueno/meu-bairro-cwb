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

export function getFacilityMarkerKey(
  category: string,
  facility: ServiceFacility,
): string {
  return `${category}-${facility.layerId}-${facility.id}`
}

function getNumericCap(value: number | TransportRenderCap | undefined): number {
  return typeof value === 'number' ? value : Number.POSITIVE_INFINITY
}

export function getRenderableFacilities(
  category: string,
  facilities: ServiceFacility[],
  _selectedCentroid: [number, number] | null,
  caps: RenderCaps = DEFAULT_RENDER_CAPS,
): ServiceFacility[] {
  if (category !== 'transporte') {
    return facilities.slice(0, getNumericCap(caps[category]))
  }

  const terminals = facilities.filter(
    (facility) => facility.subcategory === 'Terminal',
  )
  return terminals
}
