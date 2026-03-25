import { cacheGet, cacheSet } from '@/lib/cache'

export interface NominatimResult {
  displayName: string
  lat: number
  lng: number
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// Simple throttle: track last request time, delay if needed
let lastRequestTime = 0
const MIN_INTERVAL = 1100 // slightly over 1 second

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < MIN_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL - elapsed))
  }
  lastRequestTime = Date.now()
  return fetch(url)
}

export async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 3) return []

  const cacheKey = `nominatim:${query.trim().toLowerCase()}`
  const cached = cacheGet<NominatimResult[]>(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    q: `${query}, Curitiba, PR`,
    format: 'json',
    limit: '5',
    countrycodes: 'br',
    viewbox: '-49.4,-25.35,-49.15,-25.55',
    bounded: '1',
  })

  const res = await throttledFetch(`${NOMINATIM_URL}?${params}`)
  if (!res.ok) return []

  const data = await res.json()
  const results: NominatimResult[] = data.map(
    (item: Record<string, unknown>) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat as string),
      lng: parseFloat(item.lon as string),
    }),
  )

  cacheSet(cacheKey, results, 24 * 60 * 60 * 1000) // cache 24h
  return results
}
