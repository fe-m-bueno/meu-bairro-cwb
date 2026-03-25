const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const PREFIX = 'mbc:'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

function isAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function cacheGet<T>(key: string): T | null {
  if (!isAvailable()) return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  if (!isAvailable()) return
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl }
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function cacheInvalidate(key: string): void {
  if (!isAvailable()) return
  localStorage.removeItem(PREFIX + key)
}

export function cacheInvalidateAll(): void {
  if (!isAvailable()) return
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX))
  for (const key of keys) {
    localStorage.removeItem(key)
  }
}
