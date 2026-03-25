import { cacheGet, cacheSet } from '@/lib/cache'
import { calculateCentroid } from '@/lib/geo/centroid'
import type { Bairro, BusLine, GreenArea, ServiceFacility } from '@/lib/types'
import {
  BAIRROS_LAYER_ID,
  CONSERVACAO_URL,
  GREEN_AREA_LAYERS,
  type LayerDef,
  MAPA_CADASTRAL_URL,
  SERVICE_LAYERS,
  TRANSPORTE_URL,
} from './layers'

// ---------------------------------------------------------------------------
// ArcGIS query URL builder
// ---------------------------------------------------------------------------

export function buildQueryUrl(
  baseUrl: string,
  layerId: number,
  offset = 0,
): string {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    outSR: '4326',
    f: 'geojson',
    resultOffset: String(offset),
    resultRecordCount: '1000',
  })
  return `${baseUrl}/${layerId}/query?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Pagination helper — loops while exceededTransferLimit is true
// ---------------------------------------------------------------------------

interface GeoJSONResponse {
  type: string
  features: GeoJSON.Feature[]
  exceededTransferLimit?: boolean
}

export async function fetchAllFeatures(
  baseUrl: string,
  layerId: number,
): Promise<GeoJSON.Feature[]> {
  const features: GeoJSON.Feature[] = []
  let offset = 0

  while (true) {
    const url = buildQueryUrl(baseUrl, layerId, offset)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
    const data: GeoJSONResponse = await res.json()
    if (data.features?.length) {
      features.push(...data.features)
    }
    if (!data.exceededTransferLimit) break
    offset += data.features.length
  }

  return features
}

// ---------------------------------------------------------------------------
// Bairros
// ---------------------------------------------------------------------------

export async function fetchBairros(): Promise<Bairro[]> {
  const cached = cacheGet<Bairro[]>('bairros')
  if (cached) return cached

  const features = await fetchAllFeatures(MAPA_CADASTRAL_URL, BAIRROS_LAYER_ID)

  const bairros: Bairro[] = features
    .filter(
      (f) =>
        f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon',
    )
    .map((f) => {
      const props = f.properties ?? {}
      const geometry = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
      return {
        codigo: String(props.codigo ?? props.CODIGO ?? props.cd_bairro ?? ''),
        nome: String(props.nome ?? props.NOME ?? props.nm_bairro ?? ''),
        nmRegional: String(props.nm_regional ?? props.NM_REGIONAL ?? ''),
        cdRegional: String(props.cd_regional ?? props.CD_REGIONAL ?? ''),
        geometry,
        centroid: calculateCentroid(geometry),
      }
    })

  cacheSet('bairros', bairros)
  return bairros
}

// ---------------------------------------------------------------------------
// Service facilities
// ---------------------------------------------------------------------------

export function featureToFacility(
  feature: GeoJSON.Feature,
  category: string,
  subcategory: string,
  layerId: number,
): ServiceFacility | null {
  if (feature.geometry?.type !== 'Point') return null
  const geom = feature.geometry as GeoJSON.Point
  const [lng, lat] = geom.coordinates
  const props = feature.properties ?? {}
  const name = String(
    props.nome ??
      props.NOME ??
      props.ds_nome ??
      props.nm_equipamento ??
      props.name ??
      subcategory,
  )

  return {
    id: String(
      props.objectid ??
        props.OBJECTID ??
        props.id ??
        `${layerId}-${lat}-${lng}`,
    ),
    name,
    category: category as ServiceFacility['category'],
    subcategory,
    coordinates: [lat, lng],
    layerId,
  }
}

export async function fetchCategoryLayer(
  category: string,
  layerDef: LayerDef,
): Promise<ServiceFacility[]> {
  const features = await fetchAllFeatures(layerDef.baseUrl, layerDef.layerId)
  return features
    .map((f) =>
      featureToFacility(f, category, layerDef.subcategory, layerDef.layerId),
    )
    .filter((f): f is ServiceFacility => f !== null)
}

export async function fetchAllServices(): Promise<ServiceFacility[]> {
  const cached = cacheGet<ServiceFacility[]>('services')
  if (cached) return cached

  const tasks: Promise<ServiceFacility[]>[] = []
  for (const [category, layers] of Object.entries(SERVICE_LAYERS)) {
    for (const layerDef of layers) {
      tasks.push(fetchCategoryLayer(category, layerDef))
    }
  }

  const results = await Promise.allSettled(tasks)
  const facilities: ServiceFacility[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      facilities.push(...result.value)
    }
    // rejected promises are silently skipped — partial data is better than nothing
  }

  cacheSet('services', facilities)
  return facilities
}

// ---------------------------------------------------------------------------
// Green areas
// ---------------------------------------------------------------------------

export async function fetchGreenAreas(): Promise<GreenArea[]> {
  const cached = cacheGet<GreenArea[]>('greenAreas')
  if (cached) return cached

  const tasks = GREEN_AREA_LAYERS.map((layerId) =>
    fetchAllFeatures(CONSERVACAO_URL, layerId),
  )
  const results = await Promise.allSettled(tasks)

  const areas: GreenArea[] = []
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status !== 'fulfilled') continue
    const layerId = GREEN_AREA_LAYERS[i]
    for (const f of result.value) {
      if (f.geometry?.type !== 'Polygon' && f.geometry?.type !== 'MultiPolygon')
        continue
      const props = f.properties ?? {}
      areas.push({
        id: String(
          props.objectid ?? props.OBJECTID ?? `${layerId}-${areas.length}`,
        ),
        name: String(
          props.nome ?? props.NOME ?? props.nm_unidade ?? props.name ?? '',
        ),
        type: String(props.tipo ?? props.TIPO ?? props.ds_tipo ?? ''),
        geometry: f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        layerId,
      })
    }
  }

  cacheSet('greenAreas', areas)
  return areas
}

// ---------------------------------------------------------------------------
// Bus lines
// ---------------------------------------------------------------------------

export async function fetchBusLines(): Promise<BusLine[]> {
  const cached = cacheGet<BusLine[]>('busLines')
  if (cached) return cached

  // Layer 2 = bus route lines (LineString / MultiLineString geometries)
  const features = await fetchAllFeatures(TRANSPORTE_URL, 2)

  const lines: BusLine[] = []
  for (const f of features) {
    const props = f.properties ?? {}
    const name = String(
      props.nome ??
        props.NOME ??
        props.ds_linha ??
        props.nr_linha ??
        props.name ??
        '',
    )
    const id = String(props.objectid ?? props.OBJECTID ?? props.id ?? name)

    if (f.geometry?.type === 'LineString') {
      const geom = f.geometry as GeoJSON.LineString
      lines.push({
        id,
        name,
        coordinates: geom.coordinates.map(([lng, lat]) => [lat, lng]),
      })
    } else if (f.geometry?.type === 'MultiLineString') {
      const geom = f.geometry as GeoJSON.MultiLineString
      // Flatten all segments into a single coordinate array
      const coords: [number, number][] = geom.coordinates
        .flat()
        .map(([lng, lat]) => [lat, lng])
      lines.push({ id, name, coordinates: coords })
    }
    // Non-line geometries are skipped
  }

  cacheSet('busLines', lines)
  return lines
}
