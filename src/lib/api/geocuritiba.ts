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
// Proxy helper — routes through Next.js API route in the browser to avoid CORS
// ---------------------------------------------------------------------------

async function proxyFetch(
  url: string,
  signal?: AbortSignal,
): Promise<Response> {
  if (typeof window !== 'undefined') {
    return fetch(`/api/proxy?url=${encodeURIComponent(url)}`, { signal })
  }
  return fetch(url, { signal })
}

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
    resultRecordCount: '1000',
  })
  if (offset > 0) {
    params.set('resultOffset', String(offset))
  }
  return `${baseUrl}/${layerId}/query?${params.toString()}`
}

// ---------------------------------------------------------------------------
// Sleep helper
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Pagination helper — loops while exceededTransferLimit is true
// ---------------------------------------------------------------------------

interface GeoJSONResponse {
  type: string
  features: GeoJSON.Feature[]
  exceededTransferLimit?: boolean
}

const MAX_PAGES = 50

export async function fetchAllFeatures(
  baseUrl: string,
  layerId: number,
  signal?: AbortSignal,
): Promise<GeoJSON.Feature[]> {
  const features: GeoJSON.Feature[] = []
  let offset = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = buildQueryUrl(baseUrl, layerId, offset)
    const res = await proxyFetch(url, signal)
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
    const data: GeoJSONResponse = await res.json()
    if (!data.features?.length) break
    features.push(...data.features)
    if (!data.exceededTransferLimit) break
    const newOffset = offset + data.features.length
    if (newOffset === offset) break
    offset = newOffset
  }

  return features
}

// ---------------------------------------------------------------------------
// Fetch with retry — per-layer wrapper that never throws
// ---------------------------------------------------------------------------

async function fetchLayerFeaturesWithRetry(
  baseUrl: string,
  layerId: number,
  outerSignal?: AbortSignal,
): Promise<GeoJSON.Feature[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)

  if (outerSignal) {
    outerSignal.addEventListener('abort', () => controller.abort())
  }

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await fetchAllFeatures(baseUrl, layerId, controller.signal)
      } catch (err) {
        if (outerSignal?.aborted) return []
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`[fetchGreenAreas] Layer ${layerId} failed: ${message}`)
        if (attempt < 1) {
          await sleep(600)
        }
      }
    }
    return []
  } finally {
    clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Bairros
// ---------------------------------------------------------------------------

export async function fetchBairros(signal?: AbortSignal): Promise<Bairro[]> {
  const cached = cacheGet<Bairro[]>('bairros')
  if (cached) return cached

  const features = await fetchAllFeatures(
    MAPA_CADASTRAL_URL,
    BAIRROS_LAYER_ID,
    signal,
  )

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
  let name = String(
    props.nome ??
      props.NOME ??
      props.ds_nome ??
      props.nm_equipamento ??
      props.name ??
      subcategory,
  )

  // Extract extra fields (try both lowercase and uppercase)
  const extraFields = [
    'cd_ponto', 'nr_ponto', 'nr_linha', 'nm_linha',
    'ds_endereco', 'endereco', 'nm_endereco',
    'telefone', 'tp_categoria', 'ds_tipo', 'ds_bairro', 'nm_bairro',
  ] as const
  const extraProps: Record<string, string | number | null> = {}
  for (const field of extraFields) {
    const val = props[field] ?? props[field.toUpperCase()]
    if (val !== undefined && val !== null) {
      extraProps[field] = val as string | number | null
    }
  }

  // For bus stops, prefix name with point code if available
  if (subcategory === 'Parada') {
    const codigo = extraProps.cd_ponto ?? extraProps.nr_ponto
    if (codigo !== undefined && codigo !== null) {
      name = `Ponto ${codigo} — ${name}`
    }
  }

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
    properties: Object.keys(extraProps).length > 0 ? extraProps : undefined,
  }
}

export async function fetchCategoryLayer(
  category: string,
  layerDef: LayerDef,
  signal?: AbortSignal,
): Promise<ServiceFacility[]> {
  const features = await fetchAllFeatures(
    layerDef.baseUrl,
    layerDef.layerId,
    signal,
  )
  return features
    .map((f) =>
      featureToFacility(f, category, layerDef.subcategory, layerDef.layerId),
    )
    .filter((f): f is ServiceFacility => f !== null)
}

// Process an array of promises in batches of `size`
async function batchSettled<T>(
  tasks: (() => Promise<T>)[],
  size: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = []
  for (let i = 0; i < tasks.length; i += size) {
    const batch = tasks.slice(i, i + size)
    const batchResults = await Promise.allSettled(batch.map((fn) => fn()))
    results.push(...batchResults)
  }
  return results
}

export async function fetchAllServices(
  signal?: AbortSignal,
): Promise<Record<string, ServiceFacility[]>> {
  const cached = cacheGet<Record<string, ServiceFacility[]>>('services-v2')
  if (cached) return cached

  const result: Record<string, ServiceFacility[]> = {}

  // Flatten all layers across all categories into a single task list
  const allTasks: {
    category: string
    task: () => Promise<ServiceFacility[]>
  }[] = []
  for (const [category, layers] of Object.entries(SERVICE_LAYERS)) {
    for (const l of layers) {
      allTasks.push({
        category,
        task: () => fetchCategoryLayer(category, l, signal),
      })
    }
  }

  // Run all layer fetches in parallel batches of 8
  const batchResults = await batchSettled(
    allTasks.map((t) => t.task),
    8,
  )

  for (let i = 0; i < batchResults.length; i++) {
    const r = batchResults[i]
    const { category } = allTasks[i]
    if (r.status === 'fulfilled') {
      if (!result[category]) result[category] = []
      result[category].push(...r.value)
    }
  }

  cacheSet('services-v2', result)
  return result
}

// ---------------------------------------------------------------------------
// Green areas
// ---------------------------------------------------------------------------

export async function fetchGreenAreas(
  signal?: AbortSignal,
): Promise<GreenArea[]> {
  const cached = cacheGet<GreenArea[]>('greenAreas_v2')
  if (cached) return cached

  const allTasks = GREEN_AREA_LAYERS.map(
    (layerId) => () => fetchLayerFeaturesWithRetry(CONSERVACAO_URL, layerId, signal),
  )

  const results: GeoJSON.Feature[][] = []
  for (let i = 0; i < allTasks.length; i += 3) {
    const batch = allTasks.slice(i, i + 3)
    const batchResults = await Promise.allSettled(batch.map((fn) => fn()))
    for (const r of batchResults) {
      results.push(r.status === 'fulfilled' ? r.value : [])
    }
  }

  const areas: GreenArea[] = []
  for (let i = 0; i < results.length; i++) {
    const layerId = GREEN_AREA_LAYERS[i]
    const features = results[i]
    console.log(`[fetchGreenAreas] Layer ${layerId}: ${features.length} features`)
    for (const f of features) {
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

  console.log(`[fetchGreenAreas] Total: ${areas.length} green areas loaded`)
  if (areas.length === 0) {
    console.warn(
      '[fetchGreenAreas] No green areas loaded — scores will use fallback',
    )
  }

  cacheSet('greenAreas_v2', areas)
  return areas
}

// ---------------------------------------------------------------------------
// Bus lines
// ---------------------------------------------------------------------------

export async function fetchBusLines(signal?: AbortSignal): Promise<BusLine[]> {
  const cached = cacheGet<BusLine[]>('busLines')
  if (cached) return cached

  // Layer 2 = bus route lines (LineString / MultiLineString geometries)
  const features = await fetchAllFeatures(TRANSPORTE_URL, 2, signal)

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

    const lineNumber =
      String(
        props.nr_linha ?? props.NR_LINHA ?? props.ds_linha ?? props.DS_LINHA ?? '',
      ) || undefined
    const lineType =
      String(
        props.tp_categoria ?? props.TP_CATEGORIA ?? props.ds_tipo ?? props.DS_TIPO ?? '',
      ) || undefined

    if (f.geometry?.type === 'LineString') {
      const geom = f.geometry as GeoJSON.LineString
      lines.push({
        id,
        name,
        coordinates: geom.coordinates.map(([lng, lat]) => [lat, lng]),
        lineNumber,
        lineType,
      })
    } else if (f.geometry?.type === 'MultiLineString') {
      const geom = f.geometry as GeoJSON.MultiLineString
      // Flatten all segments into a single coordinate array
      const coords: [number, number][] = geom.coordinates
        .flat()
        .map(([lng, lat]) => [lat, lng])
      lines.push({ id, name, coordinates: coords, lineNumber, lineType })
    }
    // Non-line geometries are skipped
  }

  cacheSet('busLines', lines)
  return lines
}
