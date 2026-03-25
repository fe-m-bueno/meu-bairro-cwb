# Meu Bairro CWB — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a neighborhood livability explorer for Curitiba with interactive choropleth map, scoring engine, detail panels, and ranking.

**Architecture:** Client-side SPA on Next.js 15 App Router. All data from IPPUC ArcGIS APIs fetched client-side, cached in localStorage (7-day TTL). Scoring engine is pure functions computing 0-100 scores per bairro across 7 categories. Leaflet map renders choropleth colored by score.

**Tech Stack:** Next.js 15, TypeScript strict, TailwindCSS v4, shadcn/ui, Leaflet + React Leaflet, Recharts, Vitest, Biome, pnpm, @turf/intersect, @turf/area

**Spec:** `docs/superpowers/specs/2026-03-25-meu-bairro-cwb-design.md`
**Requirements:** `CLAUDE.md`

---

## Phase 0: Project Scaffolding

### Task 0.1: Create Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tailwind.config.ts` (or v4 equivalent)

- [ ] **Step 1: Scaffold with create-next-app**

```bash
cd /home/felipebueno/Development
pnpm create next-app@latest meu-bairro-cwb --typescript --tailwind --eslint=false --app --src-dir --import-alias "@/*" --turbopack
```

- [ ] **Step 2: Remove ESLint artifacts if any**

```bash
cd /home/felipebueno/Development/meu-bairro-cwb
rm -f .eslintrc* eslint.config.*
# Also remove eslint deps from package.json if present
```

- [ ] **Step 3: Verify dev server starts**

```bash
pnpm dev
```
Expected: Server starts on localhost:3000 without errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project"
```

### Task 0.2: Configure Biome

**Files:**
- Create: `biome.json`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Install and init Biome**

```bash
pnpm add -D @biomejs/biome
pnpm biome init
```

- [ ] **Step 2: Configure biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  }
}
```

- [ ] **Step 3: Add scripts to package.json**

```json
{
  "scripts": {
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write ."
  }
}
```

- [ ] **Step 4: Run check on project**

```bash
pnpm check
```
Expected: Formats existing files, no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure biome linter and formatter"
```

### Task 0.3: Install dependencies and configure tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install core deps**

```bash
pnpm add leaflet react-leaflet recharts next-themes @turf/intersect @turf/area @turf/helpers
pnpm add -D @types/leaflet vitest @vitejs/plugin-react
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```
Select: dark base color, default style. This creates `src/components/ui/` and `components.json`.

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Add test script to package.json**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Create directory structure**

```bash
mkdir -p src/lib/api src/lib/geo src/lib/score src/hooks
mkdir -p src/components/map src/components/search src/components/panel
mkdir -p src/components/ranking src/components/layout
mkdir -p public/markers
```

- [ ] **Step 6: Verify everything works**

```bash
pnpm dev    # starts without errors
pnpm test   # runs with 0 tests, exits cleanly
pnpm check  # biome runs cleanly
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add deps, shadcn/ui, vitest, directory structure"
```

---

## Phase 1: Core MVP — Types, Geo, API, Scoring, Map

### Task 1.1: Define core types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write types**

```typescript
export type CategoryKey =
  | 'saude'
  | 'educacao'
  | 'seguranca'
  | 'transporte'
  | 'areasVerdes'
  | 'cultura'
  | 'diversidade'

export interface Bairro {
  codigo: string
  nome: string
  nmRegional: string
  cdRegional: string
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  centroid: [number, number] // [lat, lng]
}

export interface ServiceFacility {
  id: string
  name: string
  category: CategoryKey
  subcategory: string
  coordinates: [number, number] // [lat, lng]
  layerId: number
}

export interface FactorScore {
  name: string
  score: number
  rawValue: number | string
  description: string
}

export interface CategoryScore {
  category: CategoryKey
  score: number
  factors: FactorScore[]
}

export interface BairroScore {
  bairroCode: string
  overall: number
  label: string
  color: string
  categories: Record<CategoryKey, CategoryScore>
  rank: number
  percentile: number
}

export interface ScoreLabel {
  label: string
  color: string
  min: number
  max: number
}

export interface GreenArea {
  id: string
  name: string
  type: string
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  layerId: number
}

export interface BusLine {
  id: string
  name: string
  coordinates: [number, number][] // array of [lat, lng] points along the route
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: define core TypeScript types"
```

### Task 1.2: Implement cache layer

**Files:**
- Create: `src/lib/cache.ts`

- [ ] **Step 1: Write cache module**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cache.ts
git commit -m "feat: add localStorage cache with TTL"
```

### Task 1.3: Implement geo utilities with tests

**Files:**
- Create: `src/lib/geo/haversine.ts`, `src/lib/geo/centroid.ts`, `src/lib/geo/point-in-polygon.ts`, `src/lib/geo/nearest.ts`, `src/lib/geo/index.ts`
- Create: `src/lib/geo/__tests__/haversine.test.ts`, `src/lib/geo/__tests__/centroid.test.ts`, `src/lib/geo/__tests__/point-in-polygon.test.ts`, `src/lib/geo/__tests__/nearest.test.ts`

- [ ] **Step 1: Write haversine test**

```typescript
// src/lib/geo/__tests__/haversine.test.ts
import { describe, expect, it } from 'vitest'
import { haversine } from '../haversine'

describe('haversine', () => {
  it('returns 0 for same point', () => {
    expect(haversine(-25.4284, -49.2733, -25.4284, -49.2733)).toBe(0)
  })

  it('calculates known distance (Praca Tiradentes to Parque Barigui ~7.5km)', () => {
    const d = haversine(-25.4295, -49.2713, -25.4232, -49.3312)
    expect(d).toBeGreaterThan(6000)
    expect(d).toBeLessThan(8000)
  })

  it('returns distance in meters', () => {
    // ~111km per degree of latitude
    const d = haversine(0, 0, 1, 0)
    expect(d).toBeGreaterThan(110000)
    expect(d).toBeLessThan(112000)
  })
})
```

- [ ] **Step 2: Run test — should fail**

```bash
pnpm test src/lib/geo/__tests__/haversine.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement haversine**

```typescript
// src/lib/geo/haversine.ts
const R = 6371000 // Earth's radius in meters

export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

- [ ] **Step 4: Run test — should pass**

```bash
pnpm test src/lib/geo/__tests__/haversine.test.ts
```
Expected: PASS.

- [ ] **Step 5: Write centroid test**

```typescript
// src/lib/geo/__tests__/centroid.test.ts
import { describe, expect, it } from 'vitest'
import { calculateCentroid } from '../centroid'

describe('calculateCentroid', () => {
  it('calculates centroid of a simple square polygon', () => {
    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]],
    }
    const [lat, lng] = calculateCentroid(polygon)
    expect(lat).toBeCloseTo(1, 1)
    expect(lng).toBeCloseTo(1, 1)
  })

  it('handles MultiPolygon', () => {
    const multi: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [[[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]]],
    }
    const [lat, lng] = calculateCentroid(multi)
    expect(lat).toBeCloseTo(1, 1)
    expect(lng).toBeCloseTo(1, 1)
  })
})
```

- [ ] **Step 6: Implement centroid**

Note: GeoJSON coordinates are [lng, lat]. Centroid returns [lat, lng] for Leaflet compatibility.

```typescript
// src/lib/geo/centroid.ts
export function calculateCentroid(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [number, number] {
  const coords =
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates.flatMap((poly) => poly[0])
      : geometry.coordinates[0]

  // Exclude closing point (same as first)
  const points = coords.slice(0, -1)
  const sumLng = points.reduce((s, c) => s + c[0], 0)
  const sumLat = points.reduce((s, c) => s + c[1], 0)

  return [sumLat / points.length, sumLng / points.length]
}
```

- [ ] **Step 7: Run centroid test — should pass**

```bash
pnpm test src/lib/geo/__tests__/centroid.test.ts
```

- [ ] **Step 8: Write point-in-polygon test**

```typescript
// src/lib/geo/__tests__/point-in-polygon.test.ts
import { describe, expect, it } from 'vitest'
import { pointInPolygon } from '../point-in-polygon'

describe('pointInPolygon', () => {
  const square: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]]],
  }

  it('returns true for point inside', () => {
    expect(pointInPolygon([1, 1], square)).toBe(true)
  })

  it('returns false for point outside', () => {
    expect(pointInPolygon([3, 3], square)).toBe(false)
  })

  it('returns false for point far away', () => {
    expect(pointInPolygon([-25, -49], square)).toBe(false)
  })
})
```

- [ ] **Step 9: Implement point-in-polygon (ray casting)**

```typescript
// src/lib/geo/point-in-polygon.ts
import type { Bairro } from '@/lib/types'

// point is [lat, lng], polygon coords are [lng, lat]
export function pointInPolygon(
  point: [number, number],
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): boolean {
  const [lat, lng] = point
  const rings =
    polygon.type === 'MultiPolygon'
      ? polygon.coordinates.map((p) => p[0])
      : [polygon.coordinates[0]]

  for (const ring of rings) {
    if (isInsideRing(lat, lng, ring)) return true
  }
  return false
}

function isInsideRing(
  lat: number,
  lng: number,
  ring: number[][],
): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = [ring[i][0], ring[i][1]] // [lng, lat]
    const [xj, yj] = [ring[j][0], ring[j][1]]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function findBairroForPoint(
  point: [number, number],
  bairros: Bairro[],
): Bairro | null {
  return bairros.find((b) => pointInPolygon(point, b.geometry)) ?? null
}
```

- [ ] **Step 10: Run point-in-polygon test — should pass**

```bash
pnpm test src/lib/geo/__tests__/point-in-polygon.test.ts
```

- [ ] **Step 11: Write nearest test**

```typescript
// src/lib/geo/__tests__/nearest.test.ts
import { describe, expect, it } from 'vitest'
import { countWithinRadius, findNearest, findWithinRadius } from '../nearest'
import type { ServiceFacility } from '@/lib/types'

const mockFacilities: ServiceFacility[] = [
  { id: '1', name: 'Close', category: 'saude', subcategory: 'UBS', coordinates: [-25.4284, -49.2733], layerId: 134 },
  { id: '2', name: 'Far', category: 'saude', subcategory: 'Hospital', coordinates: [-25.5, -49.4], layerId: 129 },
  { id: '3', name: 'Medium', category: 'saude', subcategory: 'UPA', coordinates: [-25.43, -49.28], layerId: 130 },
]

const origin: [number, number] = [-25.4284, -49.2733]

describe('findNearest', () => {
  it('returns the closest facility', () => {
    const result = findNearest(origin, mockFacilities)
    expect(result?.facility.name).toBe('Close')
    expect(result?.distance).toBe(0)
  })

  it('returns null for empty array', () => {
    expect(findNearest(origin, [])).toBeNull()
  })
})

describe('findWithinRadius', () => {
  it('finds facilities within radius', () => {
    const results = findWithinRadius(origin, mockFacilities, 2000)
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.every((r) => r.distance <= 2000)).toBe(true)
  })
})

describe('countWithinRadius', () => {
  it('counts correctly', () => {
    const count = countWithinRadius(origin, mockFacilities, 50000)
    expect(count).toBe(3) // all within 50km
  })

  it('returns 0 for tiny radius', () => {
    const count = countWithinRadius([-26, -50], mockFacilities, 1)
    expect(count).toBe(0)
  })
})
```

- [ ] **Step 12: Implement nearest**

```typescript
// src/lib/geo/nearest.ts
import type { ServiceFacility } from '@/lib/types'
import { haversine } from './haversine'

export interface FacilityWithDistance {
  facility: ServiceFacility
  distance: number // meters
}

export function findNearest(
  origin: [number, number],
  facilities: ServiceFacility[],
): FacilityWithDistance | null {
  if (facilities.length === 0) return null
  let best: FacilityWithDistance | null = null
  for (const f of facilities) {
    const d = haversine(origin[0], origin[1], f.coordinates[0], f.coordinates[1])
    if (!best || d < best.distance) {
      best = { facility: f, distance: d }
    }
  }
  return best
}

export function findWithinRadius(
  origin: [number, number],
  facilities: ServiceFacility[],
  radiusMeters: number,
): FacilityWithDistance[] {
  const results: FacilityWithDistance[] = []
  // Bounding box pre-filter (~111km per degree)
  const degBuffer = radiusMeters / 111000 + 0.01
  for (const f of facilities) {
    if (
      Math.abs(f.coordinates[0] - origin[0]) > degBuffer ||
      Math.abs(f.coordinates[1] - origin[1]) > degBuffer
    ) continue
    const d = haversine(origin[0], origin[1], f.coordinates[0], f.coordinates[1])
    if (d <= radiusMeters) {
      results.push({ facility: f, distance: d })
    }
  }
  return results.sort((a, b) => a.distance - b.distance)
}

export function countWithinRadius(
  origin: [number, number],
  facilities: ServiceFacility[],
  radiusMeters: number,
): number {
  return findWithinRadius(origin, facilities, radiusMeters).length
}
```

- [ ] **Step 13: Run nearest tests — should pass**

```bash
pnpm test src/lib/geo/__tests__/nearest.test.ts
```

- [ ] **Step 14: Create barrel export**

```typescript
// src/lib/geo/index.ts
export { haversine } from './haversine'
export { calculateCentroid } from './centroid'
export { pointInPolygon, findBairroForPoint } from './point-in-polygon'
export { findNearest, findWithinRadius, countWithinRadius } from './nearest'
export type { FacilityWithDistance } from './nearest'
```

- [ ] **Step 15: Run all geo tests**

```bash
pnpm test src/lib/geo/
```
Expected: All pass.

- [ ] **Step 16: Commit**

```bash
git add src/lib/geo/
git commit -m "feat: implement geo utilities (haversine, centroid, point-in-polygon, nearest)"
```

### Task 1.4: Implement API layer

**Files:**
- Create: `src/lib/api/layers.ts`, `src/lib/api/geocuritiba.ts`, `src/lib/api/nominatim.ts`, `src/lib/api/index.ts`

- [ ] **Step 1: Write layers config**

```typescript
// src/lib/api/layers.ts
import type { CategoryKey } from '@/lib/types'

export const MAPA_CADASTRAL_URL =
  'https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer'

export const EQUIPAMENTOS_URL =
  'https://geocuritiba.ippuc.org.br/server/rest/services/Publico_GeoCuritiba_Equipamentos_Urbanos/MapServer'

export const TRANSPORTE_URL =
  'https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/URBS_Transporte_Publico/MapServer'

export const CONSERVACAO_URL =
  'https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_Sistema_Municipal_de_Unidades_de_Conservacao/FeatureServer'

export const BAIRROS_LAYER_ID = 2

export interface LayerDef {
  layerId: number
  baseUrl: string
  subcategory: string
}

export const SERVICE_LAYERS: Record<string, LayerDef[]> = {
  saude: [
    { layerId: 129, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Hospital' },
    { layerId: 130, baseUrl: EQUIPAMENTOS_URL, subcategory: 'UPA' },
    { layerId: 134, baseUrl: EQUIPAMENTOS_URL, subcategory: 'UBS' },
    { layerId: 132, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Centro de Especialidades' },
    { layerId: 135, baseUrl: EQUIPAMENTOS_URL, subcategory: 'CAPS' },
  ],
  educacao: [
    { layerId: 78, baseUrl: EQUIPAMENTOS_URL, subcategory: 'CMEI' },
    { layerId: 80, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Escola Municipal' },
    { layerId: 81, baseUrl: EQUIPAMENTOS_URL, subcategory: 'CAEE' },
  ],
  seguranca: [
    { layerId: 142, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Policia Militar' },
    { layerId: 143, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Policia Civil' },
    { layerId: 144, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Corpo de Bombeiros' },
    { layerId: 138, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Guarda Municipal' },
  ],
  transporte: [
    { layerId: 0, baseUrl: TRANSPORTE_URL, subcategory: 'Terminal' },
    { layerId: 1, baseUrl: TRANSPORTE_URL, subcategory: 'Parada' },
    { layerId: 2, baseUrl: TRANSPORTE_URL, subcategory: 'Linha' },
  ],
  cultura: [
    { layerId: 63, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Farol do Saber' },
    { layerId: 64, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Biblioteca' },
    { layerId: 54, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Museu' },
    { layerId: 55, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Teatro' },
    { layerId: 50, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Centro Cultural' },
    { layerId: 61, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Casa da Leitura' },
    { layerId: 86, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Centro de Esporte e Lazer' },
    { layerId: 91, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Academia ao Ar Livre' },
    { layerId: 85, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Clube da Gente' },
    { layerId: 88, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Centro da Juventude' },
  ],
}

export const GREEN_AREA_LAYERS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11]
```

- [ ] **Step 2: Write geocuritiba fetcher**

```typescript
// src/lib/api/geocuritiba.ts
import type { Bairro, CategoryKey, GreenArea, ServiceFacility } from '@/lib/types'
import { calculateCentroid } from '@/lib/geo/centroid'
import { cacheGet, cacheSet } from '@/lib/cache'
import {
  BAIRROS_LAYER_ID,
  CONSERVACAO_URL,
  GREEN_AREA_LAYERS,
  MAPA_CADASTRAL_URL,
  SERVICE_LAYERS,
  type LayerDef,
} from './layers'

function buildQueryUrl(baseUrl: string, layerId: number, offset = 0): string {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    outSR: '4326',
    f: 'geojson',
    resultOffset: String(offset),
    resultRecordCount: '2000',
  })
  return `${baseUrl}/${layerId}/query?${params}`
}

async function fetchAllFeatures(
  baseUrl: string,
  layerId: number,
): Promise<GeoJSON.Feature[]> {
  const allFeatures: GeoJSON.Feature[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const url = buildQueryUrl(baseUrl, layerId, offset)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} for layer ${layerId}`)
    const data = await res.json()

    if (data.features) {
      allFeatures.push(...data.features)
    }

    hasMore = data.exceededTransferLimit === true || data.properties?.exceededTransferLimit === true
    offset += data.features?.length ?? 0
  }

  return allFeatures
}

export async function fetchBairros(): Promise<Bairro[]> {
  const cached = cacheGet<Bairro[]>('bairros')
  if (cached) return cached

  const features = await fetchAllFeatures(MAPA_CADASTRAL_URL, BAIRROS_LAYER_ID)

  const bairros: Bairro[] = features
    .filter((f) => f.geometry && f.properties)
    .map((f) => {
      const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
      return {
        codigo: String(f.properties!.CODIGO ?? f.properties!.codigo ?? ''),
        nome: String(f.properties!.NOME ?? f.properties!.nome ?? ''),
        nmRegional: String(f.properties!.NM_REGIONAL ?? f.properties!.nm_regional ?? ''),
        cdRegional: String(f.properties!.CD_REGIONAL ?? f.properties!.cd_regional ?? ''),
        geometry: geom,
        centroid: calculateCentroid(geom),
      }
    })

  cacheSet('bairros', bairros)
  return bairros
}

function featureToFacility(
  feature: GeoJSON.Feature,
  category: CategoryKey,
  subcategory: string,
  layerId: number,
): ServiceFacility | null {
  if (!feature.geometry || feature.geometry.type !== 'Point') return null
  const coords = (feature.geometry as GeoJSON.Point).coordinates
  return {
    id: String(feature.properties?.OBJECTID ?? feature.properties?.FID ?? feature.id ?? Math.random()),
    name: String(feature.properties?.NOME ?? feature.properties?.nome ?? feature.properties?.NM_EQUIPAMENTO ?? subcategory),
    category,
    subcategory,
    coordinates: [coords[1], coords[0]], // GeoJSON [lng,lat] → [lat,lng]
    layerId,
  }
}

async function fetchCategoryLayer(
  category: CategoryKey,
  layerDef: LayerDef,
): Promise<ServiceFacility[]> {
  const features = await fetchAllFeatures(layerDef.baseUrl, layerDef.layerId)
  return features
    .map((f) => featureToFacility(f, category, layerDef.subcategory, layerDef.layerId))
    .filter((f): f is ServiceFacility => f !== null)
}

export async function fetchAllServices(): Promise<Record<string, ServiceFacility[]>> {
  const cached = cacheGet<Record<string, ServiceFacility[]>>('services')
  if (cached) return cached

  const result: Record<string, ServiceFacility[]> = {}
  const entries = Object.entries(SERVICE_LAYERS) as [string, LayerDef[]][]

  const promises = entries.map(async ([category, layers]) => {
    const facilitiesByLayer = await Promise.allSettled(
      layers.map((l) => fetchCategoryLayer(category as CategoryKey, l)),
    )
    const facilities = facilitiesByLayer
      .filter((r): r is PromiseFulfilledResult<ServiceFacility[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
    return { category, facilities }
  })

  const results = await Promise.allSettled(promises)
  for (const r of results) {
    if (r.status === 'fulfilled') {
      result[r.value.category] = r.value.facilities
    }
  }

  cacheSet('services', result)
  return result
}

export async function fetchGreenAreas(): Promise<GreenArea[]> {
  const cached = cacheGet<GreenArea[]>('greenAreas')
  if (cached) return cached

  const promises = GREEN_AREA_LAYERS.map(async (layerId) => {
    const features = await fetchAllFeatures(CONSERVACAO_URL, layerId)
    return features
      .filter((f) => f.geometry)
      .map((f): GreenArea => ({
        id: String(f.properties?.OBJECTID ?? f.id ?? Math.random()),
        name: String(f.properties?.NOME ?? f.properties?.nome ?? 'Area Verde'),
        type: String(f.properties?.TIPO ?? f.properties?.tipo ?? ''),
        geometry: f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        layerId,
      }))
  })

  const results = await Promise.allSettled(promises)
  const areas = results
    .filter((r): r is PromiseFulfilledResult<GreenArea[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)

  cacheSet('greenAreas', areas)
  return areas
}
```

- [ ] **Step 2b: Add bus line fetcher to geocuritiba.ts**

Add this function to `geocuritiba.ts` to handle LineString/MultiLineString geometries for bus routes:

```typescript
export async function fetchBusLines(): Promise<BusLine[]> {
  const cached = cacheGet<BusLine[]>('busLines')
  if (cached) return cached

  const features = await fetchAllFeatures(TRANSPORTE_URL, 2) // Layer 2 = Linhas
  const lines: BusLine[] = features
    .filter((f) => f.geometry && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'))
    .map((f) => {
      const coords: [number, number][] = f.geometry.type === 'MultiLineString'
        ? (f.geometry as GeoJSON.MultiLineString).coordinates.flat().map(([lng, lat]) => [lat, lng])
        : (f.geometry as GeoJSON.LineString).coordinates.map(([lng, lat]) => [lat, lng])
      return {
        id: String(f.properties?.OBJECTID ?? f.id ?? Math.random()),
        name: String(f.properties?.NOME ?? f.properties?.nome ?? 'Linha'),
        coordinates: coords,
      }
    })

  cacheSet('busLines', lines)
  return lines
}
```

Update `src/lib/api/index.ts` to also export `fetchBusLines` and the `BusLine` type.

Also **remove layer 2 (Linha) from SERVICE_LAYERS.transporte** in `layers.ts` since bus lines are fetched separately (they are not Points).

- [ ] **Step 3: Write nominatim stub**

```typescript
// src/lib/api/nominatim.ts
export interface NominatimResult {
  displayName: string
  lat: number
  lng: number
}

// Full implementation in Phase 2
export async function searchAddress(_query: string): Promise<NominatimResult[]> {
  return []
}
```

- [ ] **Step 4: Create barrel export**

```typescript
// src/lib/api/index.ts
export { fetchBairros, fetchAllServices, fetchGreenAreas } from './geocuritiba'
export { searchAddress } from './nominatim'
export type { NominatimResult } from './nominatim'
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/
git commit -m "feat: implement IPPUC ArcGIS API layer with caching and pagination"
```

### Task 1.5: Implement scoring engine with tests

**Files:**
- Create: `src/lib/score/weights.ts`, `src/lib/score/health.ts`, `src/lib/score/education.ts`, `src/lib/score/safety.ts`, `src/lib/score/transport.ts`, `src/lib/score/green.ts`, `src/lib/score/culture.ts`, `src/lib/score/variety.ts`, `src/lib/score/calculator.ts`, `src/lib/score/index.ts`
- Create: `src/lib/score/__tests__/health.test.ts`, `src/lib/score/__tests__/education.test.ts`, `src/lib/score/__tests__/safety.test.ts`, `src/lib/score/__tests__/transport.test.ts`, `src/lib/score/__tests__/green.test.ts`, `src/lib/score/__tests__/culture.test.ts`, `src/lib/score/__tests__/variety.test.ts`, `src/lib/score/__tests__/calculator.test.ts`

This is a large task. Each scorer follows the same pattern: pure function taking centroid + facilities, returning CategoryScore. Threshold values come from CLAUDE.md.

- [ ] **Step 1: Write weights config**

```typescript
// src/lib/score/weights.ts
import type { CategoryKey, ScoreLabel } from '@/lib/types'

export const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  saude: 0.20,
  educacao: 0.18,
  seguranca: 0.17,
  transporte: 0.18,
  areasVerdes: 0.12,
  cultura: 0.08,
  diversidade: 0.07,
}

export const SCORE_LABELS: ScoreLabel[] = [
  { label: 'Excelente', color: '#10b981', min: 85, max: 100 },
  { label: 'Muito Bom', color: '#22c55e', min: 70, max: 84 },
  { label: 'Bom', color: '#84cc16', min: 55, max: 69 },
  { label: 'Regular', color: '#eab308', min: 40, max: 54 },
  { label: 'Abaixo da Média', color: '#f97316', min: 25, max: 39 },
  { label: 'Crítico', color: '#ef4444', min: 0, max: 24 },
]

export function getScoreLabel(score: number): { label: string; color: string } {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const found = SCORE_LABELS.find((s) => clamped >= s.min && clamped <= s.max)
  return found ?? { label: 'Crítico', color: '#ef4444' }
}
```

- [ ] **Step 2: Write health scorer test**

```typescript
// src/lib/score/__tests__/health.test.ts
import { describe, expect, it } from 'vitest'
import { calculateHealthScore } from '../health'
import type { ServiceFacility } from '@/lib/types'

const centroid: [number, number] = [-25.43, -49.27]

function makeFacility(sub: string, lat: number, lng: number): ServiceFacility {
  return { id: sub + lat, name: sub, category: 'saude', subcategory: sub, coordinates: [lat, lng], layerId: 0 }
}

describe('calculateHealthScore', () => {
  it('scores 100 when UBS, hospital, and 5+ facilities are very close', () => {
    const facilities = [
      makeFacility('UBS', -25.4301, -49.2701),
      makeFacility('Hospital', -25.4305, -49.2705),
      makeFacility('UPA', -25.4302, -49.2702),
      makeFacility('UBS', -25.4303, -49.2703),
      makeFacility('UBS', -25.4304, -49.2704),
    ]
    const score = calculateHealthScore(centroid, facilities)
    expect(score.score).toBeGreaterThanOrEqual(90)
  })

  it('scores low when no facilities exist', () => {
    const score = calculateHealthScore(centroid, [])
    expect(score.score).toBeLessThanOrEqual(5)
  })

  it('returns correct category key', () => {
    const score = calculateHealthScore(centroid, [])
    expect(score.category).toBe('saude')
  })
})
```

- [ ] **Step 3: Implement health scorer**

```typescript
// src/lib/score/health.ts
import type { CategoryScore, ServiceFacility } from '@/lib/types'
import { findNearest, countWithinRadius } from '@/lib/geo'

function scoreDistance(distance: number | null, thresholds: [number, number][]): number {
  if (distance === null) return 0
  for (const [maxDist, score] of thresholds) {
    if (distance < maxDist) return score
  }
  return thresholds[thresholds.length - 1]?.[1] ?? 0
}

export function calculateHealthScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const ubsList = facilities.filter((f) => f.subcategory === 'UBS')
  const hospitalList = facilities.filter((f) =>
    f.subcategory === 'Hospital' || f.subcategory === 'UPA',
  )

  const nearestUbs = findNearest(centroid, ubsList)
  const nearestHospital = findNearest(centroid, hospitalList)
  const density = countWithinRadius(centroid, facilities, 1000)

  const ubsScore = scoreDistance(nearestUbs?.distance ?? null, [
    [500, 100], [1000, 80], [2000, 50], [3000, 20],
  ]) || 5

  const hospitalScore = scoreDistance(nearestHospital?.distance ?? null, [
    [1000, 100], [2000, 80], [3000, 60], [5000, 30],
  ]) || 5

  let densityScore = 0
  if (density >= 5) densityScore = 100
  else if (density === 4) densityScore = 80
  else if (density === 3) densityScore = 60
  else if (density === 2) densityScore = 40
  else if (density === 1) densityScore = 20

  const score = ubsScore * 0.4 + hospitalScore * 0.35 + densityScore * 0.25

  return {
    category: 'saude',
    score: Math.round(score),
    factors: [
      { name: 'UBS mais próxima', score: ubsScore, rawValue: nearestUbs?.distance ?? -1, description: nearestUbs ? `${Math.round(nearestUbs.distance)}m` : 'Nenhuma encontrada' },
      { name: 'Hospital/UPA mais próximo', score: hospitalScore, rawValue: nearestHospital?.distance ?? -1, description: nearestHospital ? `${Math.round(nearestHospital.distance)}m` : 'Nenhum encontrado' },
      { name: 'Unidades de saúde em 1km', score: densityScore, rawValue: density, description: `${density} unidade(s)` },
    ],
  }
}
```

- [ ] **Step 4: Run health test — should pass**

```bash
pnpm test src/lib/score/__tests__/health.test.ts
```

- [ ] **Step 5: Implement education scorer**

```typescript
// src/lib/score/education.ts
import type { CategoryScore, ServiceFacility } from '@/lib/types'
import { findNearest, countWithinRadius } from '@/lib/geo'

function scoreDistance(distance: number | null, thresholds: [number, number][]): number {
  if (distance === null) return 0
  for (const [maxDist, score] of thresholds) {
    if (distance < maxDist) return score
  }
  return thresholds[thresholds.length - 1]?.[1] ?? 0
}

export function calculateEducationScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const escolas = facilities.filter((f) => f.subcategory === 'Escola Municipal')
  const cmeis = facilities.filter((f) => f.subcategory === 'CMEI')

  const nearestEscola = findNearest(centroid, escolas)
  const nearestCmei = findNearest(centroid, cmeis)
  const density = countWithinRadius(centroid, facilities, 1000)

  const escolaThresholds: [number, number][] = [[500, 100], [1000, 80], [1500, 50], [2000, 30]]
  const escolaScore = scoreDistance(nearestEscola?.distance ?? null, escolaThresholds) || 5
  const cmeiScore = scoreDistance(nearestCmei?.distance ?? null, escolaThresholds) || 5

  let densityScore = 0
  if (density >= 6) densityScore = 100
  else if (density >= 4) densityScore = 80
  else if (density === 3) densityScore = 60
  else if (density === 2) densityScore = 40
  else if (density === 1) densityScore = 20

  const score = (escolaScore + cmeiScore + densityScore) / 3

  return {
    category: 'educacao',
    score: Math.round(score),
    factors: [
      { name: 'Escola mais próxima', score: escolaScore, rawValue: nearestEscola?.distance ?? -1, description: nearestEscola ? `${Math.round(nearestEscola.distance)}m` : 'Nenhuma encontrada' },
      { name: 'CMEI mais próximo', score: cmeiScore, rawValue: nearestCmei?.distance ?? -1, description: nearestCmei ? `${Math.round(nearestCmei.distance)}m` : 'Nenhum encontrado' },
      { name: 'Unidades de educação em 1km', score: densityScore, rawValue: density, description: `${density} unidade(s)` },
    ],
  }
}
```

- [ ] **Step 6: Implement safety scorer**

```typescript
// src/lib/score/safety.ts
import type { CategoryScore, ServiceFacility } from '@/lib/types'
import { findNearest, countWithinRadius } from '@/lib/geo'

function scoreDistance(distance: number | null, thresholds: [number, number][]): number {
  if (distance === null) return 0
  for (const [maxDist, score] of thresholds) {
    if (distance < maxDist) return score
  }
  return thresholds[thresholds.length - 1]?.[1] ?? 0
}

export function calculateSafetyScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const pmGuarda = facilities.filter((f) =>
    f.subcategory === 'Policia Militar' || f.subcategory === 'Guarda Municipal',
  )
  const delegacia = facilities.filter((f) => f.subcategory === 'Policia Civil')
  const bombeiros = facilities.filter((f) => f.subcategory === 'Corpo de Bombeiros')

  const nearestPm = findNearest(centroid, pmGuarda)
  const nearestDelegacia = findNearest(centroid, delegacia)
  const nearestBombeiros = findNearest(centroid, bombeiros)
  const density = countWithinRadius(centroid, facilities, 2000)

  const pmScore = scoreDistance(nearestPm?.distance ?? null, [[1000, 100], [2000, 70], [3000, 40]]) || 10
  const delegaciaScore = scoreDistance(nearestDelegacia?.distance ?? null, [[2000, 100], [3000, 70], [5000, 40]]) || 10
  const bombeirosScore = scoreDistance(nearestBombeiros?.distance ?? null, [[2000, 100], [3000, 70], [5000, 40]]) || 10

  let densityScore = 0
  if (density >= 4) densityScore = 100
  else if (density === 3) densityScore = 75
  else if (density === 2) densityScore = 50
  else if (density === 1) densityScore = 25

  const score = pmScore * 0.35 + delegaciaScore * 0.25 + bombeirosScore * 0.20 + densityScore * 0.20

  return {
    category: 'seguranca',
    score: Math.round(score),
    factors: [
      { name: 'PM/Guarda mais próxima', score: pmScore, rawValue: nearestPm?.distance ?? -1, description: nearestPm ? `${Math.round(nearestPm.distance)}m` : 'Nenhuma encontrada' },
      { name: 'Delegacia mais próxima', score: delegaciaScore, rawValue: nearestDelegacia?.distance ?? -1, description: nearestDelegacia ? `${Math.round(nearestDelegacia.distance)}m` : 'Nenhuma encontrada' },
      { name: 'Bombeiros mais próximo', score: bombeirosScore, rawValue: nearestBombeiros?.distance ?? -1, description: nearestBombeiros ? `${Math.round(nearestBombeiros.distance)}m` : 'Nenhum encontrado' },
      { name: 'Segurança em 2km', score: densityScore, rawValue: density, description: `${density} unidade(s)` },
    ],
  }
}
```

- [ ] **Step 7: Implement transport scorer**

Note: Bus lines (layer 2) are LineString geometries, not Points. The API layer stores them separately. For "route variety", we need to count unique lines passing through the bairro. The `featureToFacility` function will be updated to also handle LineString features for transport lines, extracting a representative point (first coordinate) for distance purposes, and storing the full geometry separately for variety counting.

**Update types.ts** — add `BusLine` type:

```typescript
export interface BusLine {
  id: string
  name: string
  coordinates: [number, number][] // array of [lat, lng] points along the route
}
```

**Update geocuritiba.ts** — add `fetchBusLines()` that fetches layer 2 from transport endpoint and returns `BusLine[]` (extracting LineString/MultiLineString coordinates). Add this to the API barrel export.

**Update use-services.ts** — also fetch bus lines.

```typescript
// src/lib/score/transport.ts
import type { BusLine, CategoryScore, ServiceFacility } from '@/lib/types'
import { countWithinRadius, findNearest } from '@/lib/geo'
import { pointInPolygon } from '@/lib/geo/point-in-polygon'

export function calculateTransportScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
  bairroGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  busLines: BusLine[] = [],
): CategoryScore {
  const stops = facilities.filter((f) => f.subcategory === 'Parada')
  const terminals = facilities.filter((f) => f.subcategory === 'Terminal')

  const stopCount = countWithinRadius(centroid, stops, 500)
  const nearestTerminal = findNearest(centroid, terminals)

  // Count unique bus lines passing through the bairro
  const linesInBairro = busLines.filter((line) =>
    line.coordinates.some((coord) => pointInPolygon(coord, bairroGeometry)),
  )
  const lineCount = linesInBairro.length

  let stopScore = 0
  if (stopCount >= 15) stopScore = 100
  else if (stopCount >= 10) stopScore = 85
  else if (stopCount >= 5) stopScore = 65
  else if (stopCount >= 2) stopScore = 40
  else if (stopCount === 1) stopScore = 20

  const terminalScore = findNearest(centroid, terminals)
    ? (() => {
        const d = nearestTerminal!.distance
        if (d < 500) return 100
        if (d < 1000) return 80
        if (d < 2000) return 60
        if (d < 3000) return 30
        return 10
      })()
    : 0

  let lineScore = 0
  if (lineCount >= 10) lineScore = 100
  else if (lineCount >= 7) lineScore = 80
  else if (lineCount >= 4) lineScore = 60
  else if (lineCount >= 2) lineScore = 35
  else if (lineCount === 1) lineScore = 15

  const score = stopScore * 0.45 + terminalScore * 0.30 + lineScore * 0.25

  return {
    category: 'transporte',
    score: Math.round(score),
    factors: [
      { name: 'Paradas em 500m', score: stopScore, rawValue: stopCount, description: `${stopCount} parada(s)` },
      { name: 'Terminal mais próximo', score: terminalScore, rawValue: nearestTerminal?.distance ?? -1, description: nearestTerminal ? `${Math.round(nearestTerminal.distance)}m` : 'Nenhum encontrado' },
      { name: 'Linhas de ônibus', score: lineScore, rawValue: lineCount, description: `${lineCount} linha(s)` },
    ],
  }
}
```

- [ ] **Step 8: Implement green areas scorer**

Green areas have polygon geometries. For "nearest park" we compute centroid of each green area first. For "coverage" we use Turf.js intersect.

```typescript
// src/lib/score/green.ts
import type { CategoryScore, GreenArea } from '@/lib/types'
import { haversine } from '@/lib/geo/haversine'
import { calculateCentroid } from '@/lib/geo/centroid'
import intersect from '@turf/intersect'
import area from '@turf/area'
import { polygon as turfPolygon, multiPolygon as turfMultiPolygon } from '@turf/helpers'

function greenAreaCentroid(g: GreenArea): [number, number] {
  return calculateCentroid(g.geometry)
}

function toTurfGeometry(geom: GeoJSON.Polygon | GeoJSON.MultiPolygon) {
  if (geom.type === 'Polygon') return turfPolygon(geom.coordinates)
  return turfMultiPolygon(geom.coordinates)
}

export function calculateGreenScore(
  centroid: [number, number],
  greenAreas: GreenArea[],
  bairroGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): CategoryScore {
  // Nearest park/bosque
  let nearestDist = Number.POSITIVE_INFINITY
  let nearestName = ''
  for (const g of greenAreas) {
    const gc = greenAreaCentroid(g)
    const d = haversine(centroid[0], centroid[1], gc[0], gc[1])
    if (d < nearestDist) {
      nearestDist = d
      nearestName = g.name
    }
  }
  if (!greenAreas.length) nearestDist = -1

  let nearestScore = 10
  if (nearestDist < 300) nearestScore = 100
  else if (nearestDist < 500) nearestScore = 85
  else if (nearestDist < 1000) nearestScore = 65
  else if (nearestDist < 2000) nearestScore = 35
  else if (nearestDist < 0) nearestScore = 0

  // Coverage % via Turf.js
  let coveragePercent = 0
  try {
    const bairroTurf = toTurfGeometry(bairroGeometry)
    const bairroArea = area(bairroTurf)
    let greenOverlapArea = 0
    for (const g of greenAreas) {
      try {
        const greenTurf = toTurfGeometry(g.geometry)
        const overlap = intersect(bairroTurf, greenTurf)
        if (overlap) greenOverlapArea += area(overlap)
      } catch { /* skip invalid geometries */ }
    }
    coveragePercent = bairroArea > 0 ? (greenOverlapArea / bairroArea) * 100 : 0
  } catch { /* skip if bairro geometry is invalid */ }

  let coverageScore = 5
  if (coveragePercent > 15) coverageScore = 100
  else if (coveragePercent >= 10) coverageScore = 80
  else if (coveragePercent >= 5) coverageScore = 55
  else if (coveragePercent >= 1) coverageScore = 30

  // Count within 2km
  let countNearby = 0
  for (const g of greenAreas) {
    const gc = greenAreaCentroid(g)
    const d = haversine(centroid[0], centroid[1], gc[0], gc[1])
    if (d <= 2000) countNearby++
  }

  let countScore = 0
  if (countNearby >= 4) countScore = 100
  else if (countNearby === 3) countScore = 75
  else if (countNearby === 2) countScore = 50
  else if (countNearby === 1) countScore = 25

  const score = nearestScore * 0.40 + coverageScore * 0.35 + countScore * 0.25

  return {
    category: 'areasVerdes',
    score: Math.round(score),
    factors: [
      { name: 'Área verde mais próxima', score: nearestScore, rawValue: nearestDist, description: nearestDist >= 0 ? `${Math.round(nearestDist)}m (${nearestName})` : 'Nenhuma encontrada' },
      { name: 'Cobertura verde', score: coverageScore, rawValue: coveragePercent, description: `${coveragePercent.toFixed(1)}% do bairro` },
      { name: 'Áreas verdes em 2km', score: countScore, rawValue: countNearby, description: `${countNearby} área(s)` },
    ],
  }
}
```

- [ ] **Step 9: Implement culture scorer**

```typescript
// src/lib/score/culture.ts
import type { CategoryScore, ServiceFacility } from '@/lib/types'
import { findNearest, countWithinRadius } from '@/lib/geo'

export function calculateCultureScore(
  centroid: [number, number],
  facilities: ServiceFacility[],
): CategoryScore {
  const density = countWithinRadius(centroid, facilities, 1000)
  const nearest = findNearest(centroid, facilities)

  let densityScore = 0
  if (density >= 5) densityScore = 100
  else if (density >= 3) densityScore = 75
  else if (density === 2) densityScore = 50
  else if (density === 1) densityScore = 25

  let nearestScore = 0
  if (nearest) {
    const d = nearest.distance
    if (d < 500) nearestScore = 100
    else if (d < 1000) nearestScore = 70
    else if (d < 2000) nearestScore = 40
    else nearestScore = 10
  }

  const score = (densityScore + nearestScore) / 2

  return {
    category: 'cultura',
    score: Math.round(score),
    factors: [
      { name: 'Cultura/esporte em 1km', score: densityScore, rawValue: density, description: `${density} equipamento(s)` },
      { name: 'Mais próximo', score: nearestScore, rawValue: nearest?.distance ?? -1, description: nearest ? `${Math.round(nearest.distance)}m (${nearest.facility.name})` : 'Nenhum encontrado' },
    ],
  }
}
```

- [ ] **Step 10: Implement variety scorer**

```typescript
// src/lib/score/variety.ts
import type { CategoryScore, GreenArea, ServiceFacility } from '@/lib/types'
import { countWithinRadius } from '@/lib/geo'
import { haversine } from '@/lib/geo/haversine'
import { calculateCentroid } from '@/lib/geo/centroid'

export function calculateVarietyScore(
  centroid: [number, number],
  services: Record<string, ServiceFacility[]>,
  greenAreas: GreenArea[],
): CategoryScore {
  const checks: { name: string; present: boolean }[] = []

  // Health within 2km
  const healthCount = countWithinRadius(centroid, services.saude ?? [], 2000)
  checks.push({ name: 'Saúde (2km)', present: healthCount > 0 })

  // School within 1.5km
  const eduCount = countWithinRadius(centroid, services.educacao ?? [], 1500)
  checks.push({ name: 'Educação (1.5km)', present: eduCount > 0 })

  // Security within 3km
  const secCount = countWithinRadius(centroid, services.seguranca ?? [], 3000)
  checks.push({ name: 'Segurança (3km)', present: secCount > 0 })

  // Bus stop within 500m
  const stops = (services.transporte ?? []).filter((f) => f.subcategory === 'Parada')
  const stopCount = countWithinRadius(centroid, stops, 500)
  checks.push({ name: 'Transporte (500m)', present: stopCount > 0 })

  // Green area within 1km
  const hasGreen = greenAreas.some((g) => {
    const gc = calculateCentroid(g.geometry)
    return haversine(centroid[0], centroid[1], gc[0], gc[1]) <= 1000
  })
  checks.push({ name: 'Área verde (1km)', present: hasGreen })

  // Culture within 2km
  const cultureCount = countWithinRadius(centroid, services.cultura ?? [], 2000)
  checks.push({ name: 'Cultura (2km)', present: cultureCount > 0 })

  const presentCount = checks.filter((c) => c.present).length
  let score = 5
  if (presentCount >= 6) score = 100
  else if (presentCount === 5) score = 80
  else if (presentCount === 4) score = 60
  else if (presentCount === 3) score = 40
  else if (presentCount === 2) score = 20

  return {
    category: 'diversidade',
    score,
    factors: checks.map((c) => ({
      name: c.name,
      score: c.present ? 100 : 0,
      rawValue: c.present ? 1 : 0,
      description: c.present ? 'Disponível' : 'Não encontrado',
    })),
  }
}
```

- [ ] **Step 11: Write tests for each scorer**

Create test files: `education.test.ts`, `safety.test.ts`, `transport.test.ts`, `green.test.ts`, `culture.test.ts`, `variety.test.ts`. Each follows the health test pattern:
- Test with close/many facilities → high score
- Test with no facilities → low/minimum score
- Test boundary conditions at threshold distances
- Verify correct category key returned

- [ ] **Step 12: Run all scorer tests**

```bash
pnpm test src/lib/score/
```
Expected: All pass.

- [ ] **Step 8: Implement calculator (orchestrator)**

```typescript
// src/lib/score/calculator.ts
import type { Bairro, BairroScore, BusLine, CategoryKey, GreenArea, ServiceFacility } from '@/lib/types'
import { CATEGORY_WEIGHTS, getScoreLabel } from './weights'
import { calculateHealthScore } from './health'
import { calculateEducationScore } from './education'
import { calculateSafetyScore } from './safety'
import { calculateTransportScore } from './transport'
import { calculateGreenScore } from './green'
import { calculateCultureScore } from './culture'
import { calculateVarietyScore } from './variety'

export function calculateBairroScore(
  bairro: Bairro,
  services: Record<string, ServiceFacility[]>,
  greenAreas: GreenArea[],
  busLines: BusLine[] = [],
): BairroScore {
  const c = bairro.centroid
  const categories = {
    saude: calculateHealthScore(c, services.saude ?? []),
    educacao: calculateEducationScore(c, services.educacao ?? []),
    seguranca: calculateSafetyScore(c, services.seguranca ?? []),
    transporte: calculateTransportScore(c, services.transporte ?? [], bairro.geometry, busLines),
    areasVerdes: calculateGreenScore(c, greenAreas, bairro.geometry),
    cultura: calculateCultureScore(c, services.cultura ?? []),
    diversidade: calculateVarietyScore(c, services, greenAreas),
  }

  const overall = Object.entries(categories).reduce(
    (sum, [key, cat]) => sum + cat.score * CATEGORY_WEIGHTS[key as CategoryKey],
    0,
  )

  const { label, color } = getScoreLabel(overall)

  return {
    bairroCode: bairro.codigo,
    overall: Math.round(overall),
    label,
    color,
    categories,
    rank: 0, // set by calculateAllScores
    percentile: 0,
  }
}

export function calculateAllScores(
  bairros: Bairro[],
  services: Record<string, ServiceFacility[]>,
  greenAreas: GreenArea[],
  busLines: BusLine[] = [],
): BairroScore[] {
  const scores = bairros.map((b) => calculateBairroScore(b, services, greenAreas, busLines))
  scores.sort((a, b) => b.overall - a.overall)
  scores.forEach((s, i) => {
    s.rank = i + 1
    s.percentile = Math.round(((scores.length - s.rank) / scores.length) * 100)
  })
  return scores
}
```

- [ ] **Step 9: Write calculator test**

```typescript
// src/lib/score/__tests__/calculator.test.ts
import { describe, expect, it } from 'vitest'
import { calculateAllScores, calculateBairroScore } from '../calculator'
import type { Bairro } from '@/lib/types'

const mockBairro: Bairro = {
  codigo: 'TEST',
  nome: 'Test',
  nmRegional: 'Regional',
  cdRegional: '1',
  geometry: { type: 'Polygon', coordinates: [[[-49.28, -25.42], [-49.28, -25.44], [-49.26, -25.44], [-49.26, -25.42], [-49.28, -25.42]]] },
  centroid: [-25.43, -49.27],
}

describe('calculateBairroScore', () => {
  it('returns a valid score with empty services', () => {
    const score = calculateBairroScore(mockBairro, {}, [])
    expect(score.overall).toBeGreaterThanOrEqual(0)
    expect(score.overall).toBeLessThanOrEqual(100)
    expect(score.bairroCode).toBe('TEST')
    expect(score.label).toBeTruthy()
    expect(score.color).toBeTruthy()
  })
})

describe('calculateAllScores', () => {
  it('ranks bairros correctly', () => {
    const bairros = [mockBairro, { ...mockBairro, codigo: 'TEST2', nome: 'Test2' }]
    const scores = calculateAllScores(bairros, {}, [])
    expect(scores).toHaveLength(2)
    expect(scores[0].rank).toBe(1)
    expect(scores[1].rank).toBe(2)
  })
})
```

- [ ] **Step 10: Run all tests**

```bash
pnpm test
```
Expected: All pass.

- [ ] **Step 11: Create barrel export**

```typescript
// src/lib/score/index.ts
export { calculateBairroScore, calculateAllScores } from './calculator'
export { getScoreLabel, CATEGORY_WEIGHTS, SCORE_LABELS } from './weights'
```

- [ ] **Step 12: Commit**

```bash
git add src/lib/score/
git commit -m "feat: implement scoring engine with 7 category scorers and tests"
```

### Task 1.6: Implement data hooks

**Files:**
- Create: `src/hooks/use-bairros.ts`, `src/hooks/use-services.ts`, `src/hooks/use-scores.ts`

- [ ] **Step 1: Write use-bairros hook**

```typescript
// src/hooks/use-bairros.ts
'use client'

import { useEffect, useState } from 'react'
import { fetchBairros } from '@/lib/api'
import type { Bairro } from '@/lib/types'

export function useBairros() {
  const [bairros, setBairros] = useState<Bairro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchBairros()
      .then(setBairros)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { bairros, isLoading, error }
}
```

- [ ] **Step 2: Write use-services hook**

```typescript
// src/hooks/use-services.ts
'use client'

import { useEffect, useState } from 'react'
import { fetchAllServices, fetchGreenAreas, fetchBusLines } from '@/lib/api'
import type { BusLine, GreenArea, ServiceFacility } from '@/lib/types'

export function useServices() {
  const [services, setServices] = useState<Record<string, ServiceFacility[]>>({})
  const [greenAreas, setGreenAreas] = useState<GreenArea[]>([])
  const [busLines, setBusLines] = useState<BusLine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    Promise.allSettled([fetchAllServices(), fetchGreenAreas(), fetchBusLines()])
      .then(([svcResult, greenResult, busResult]) => {
        if (svcResult.status === 'fulfilled') setServices(svcResult.value)
        if (greenResult.status === 'fulfilled') setGreenAreas(greenResult.value)
        if (busResult.status === 'fulfilled') setBusLines(busResult.value)
        if (svcResult.status === 'rejected' && greenResult.status === 'rejected') {
          setError(new Error('Failed to fetch services'))
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { services, greenAreas, busLines, isLoading, error }
}
```

- [ ] **Step 3: Write use-scores hook**

```typescript
// src/hooks/use-scores.ts
'use client'

import { useMemo } from 'react'
import { calculateAllScores } from '@/lib/score'
import { useBairros } from './use-bairros'
import { useServices } from './use-services'
import type { BairroScore, CategoryKey, CategoryScore } from '@/lib/types'
import { cacheGet, cacheSet } from '@/lib/cache'

export function useScores() {
  const { bairros, isLoading: bairrosLoading, error: bairrosError } = useBairros()
  const { services, greenAreas, busLines, isLoading: servicesLoading, error: servicesError } = useServices()

  const isLoading = bairrosLoading || servicesLoading
  const error = bairrosError || servicesError

  const scores = useMemo(() => {
    if (bairros.length === 0 || Object.keys(services).length === 0) return []

    // Only use cached scores if services also came from cache (same session)
    // Fresh fetch → recompute scores
    const computed = calculateAllScores(bairros, services, greenAreas, busLines)
    cacheSet('scores', computed)
    return computed
  }, [bairros, services, greenAreas, busLines])

  const cityAverage = useMemo(() => {
    if (scores.length === 0) return null
    const keys: CategoryKey[] = ['saude', 'educacao', 'seguranca', 'transporte', 'areasVerdes', 'cultura', 'diversidade']
    const avg: Record<string, number> = {}
    for (const key of keys) {
      avg[key] = Math.round(scores.reduce((s, sc) => s + sc.categories[key].score, 0) / scores.length)
    }
    avg.overall = Math.round(scores.reduce((s, sc) => s + sc.overall, 0) / scores.length)
    return avg
  }, [scores])

  return { scores, cityAverage, bairros, isLoading, error }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add data hooks (useBairros, useServices, useScores)"
```

### Task 1.7: Build map components

**Files:**
- Create: `src/components/map/city-map.tsx`, `src/components/map/neighborhood-layer.tsx`

- [ ] **Step 1: Write neighborhood layer**

```typescript
// src/components/map/neighborhood-layer.tsx
'use client'

import { GeoJSON, Tooltip } from 'react-leaflet'
import type { Bairro, BairroScore } from '@/lib/types'
import { useMemo } from 'react'
import type { Layer, LeafletMouseEvent } from 'leaflet'

interface Props {
  bairros: Bairro[]
  scores: BairroScore[]
  onSelectBairro: (codigo: string) => void
}

function getColor(score: number): string {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#22c55e'
  if (score >= 55) return '#84cc16'
  if (score >= 40) return '#eab308'
  if (score >= 25) return '#f97316'
  return '#ef4444'
}

export function NeighborhoodLayer({ bairros, scores, onSelectBairro }: Props) {
  const scoreMap = useMemo(() => {
    const map = new Map<string, BairroScore>()
    for (const s of scores) map.set(s.bairroCode, s)
    return map
  }, [scores])

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: bairros.map((b) => ({
        type: 'Feature' as const,
        properties: { codigo: b.codigo, nome: b.nome },
        geometry: b.geometry,
      })),
    }),
    [bairros],
  )

  const key = scores.map((s) => s.overall).join(',')

  return (
    <GeoJSON
      key={key}
      data={geojson}
      style={(feature) => {
        const codigo = feature?.properties?.codigo
        const score = scoreMap.get(codigo)
        return {
          fillColor: score ? getColor(score.overall) : '#6b7280',
          fillOpacity: 0.6,
          weight: 1,
          color: '#374151',
          opacity: 0.8,
        }
      }}
      onEachFeature={(feature, layer) => {
        const codigo = feature.properties?.codigo
        const nome = feature.properties?.nome
        const score = scoreMap.get(codigo)

        layer.bindTooltip(
          `<strong>${nome}</strong><br/>Score: ${score?.overall ?? '...'} - ${score?.label ?? ''}`,
          { sticky: true },
        )

        layer.on({
          click: () => onSelectBairro(codigo),
          mouseover: (e: LeafletMouseEvent) => {
            e.target.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.8 })
          },
          mouseout: (e: LeafletMouseEvent) => {
            e.target.setStyle({ weight: 1, color: '#374151', fillOpacity: 0.6 })
          },
        })
      }}
    />
  )
}
```

- [ ] **Step 2: Write city map**

```typescript
// src/components/map/city-map.tsx
'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { NeighborhoodLayer } from './neighborhood-layer'
import type { Bairro, BairroScore } from '@/lib/types'

interface Props {
  bairros: Bairro[]
  scores: BairroScore[]
  onSelectBairro: (codigo: string) => void
}

const CURITIBA_CENTER: [number, number] = [-25.4284, -49.2733]
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'

export default function CityMap({ bairros, scores, onSelectBairro }: Props) {
  return (
    <MapContainer
      center={CURITIBA_CENTER}
      zoom={12}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer url={DARK_TILES} attribution={ATTRIBUTION} />
      {bairros.length > 0 && scores.length > 0 && (
        <NeighborhoodLayer
          bairros={bairros}
          scores={scores}
          onSelectBairro={onSelectBairro}
        />
      )}
    </MapContainer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/map/
git commit -m "feat: add Leaflet map with choropleth neighborhood layer"
```

### Task 1.8: Build layout and main page

**Files:**
- Create: `src/components/layout/header.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Write header**

```typescript
// src/components/layout/header.tsx
import Link from 'next/link'

export function Header() {
  return (
    <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur">
      <Link href="/" className="text-lg font-bold text-white">
        Meu Bairro CWB
      </Link>
      <nav className="flex gap-4 text-sm text-zinc-400">
        <Link href="/ranking" className="hover:text-white transition-colors">
          Ranking
        </Link>
        <Link href="/metodologia" className="hover:text-white transition-colors">
          Metodologia
        </Link>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Update globals.css**

```css
@import "tailwindcss";

:root {
  --background: #09090b;
  --foreground: #fafafa;
}

body {
  background: var(--background);
  color: var(--foreground);
}

/* Leaflet overrides for dark theme */
.leaflet-container {
  background: #1a1a2e;
}

.leaflet-tooltip {
  background: #18181b;
  border-color: #3f3f46;
  color: #fafafa;
}

.leaflet-tooltip-top::before {
  border-top-color: #18181b;
}
```

- [ ] **Step 3: Update layout.tsx**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/header'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meu Bairro CWB — Qualidade de vida nos bairros de Curitiba',
  description: 'Explore a qualidade de vida dos 75 bairros de Curitiba com dados reais do IPPUC.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased`}>
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Update page.tsx (main map page)**

```typescript
// src/app/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useScores } from '@/hooks/use-scores'

const CityMap = dynamic(() => import('@/components/map/city-map'), { ssr: false })

export default function HomePage() {
  const { scores, bairros, isLoading } = useScores()
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null)

  const selected = selectedBairro
    ? scores.find((s) => s.bairroCode === selectedBairro)
    : null
  const selectedName = selectedBairro
    ? bairros.find((b) => b.codigo === selectedBairro)?.nome
    : null

  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80">
          <p className="text-zinc-400">Carregando dados dos bairros...</p>
        </div>
      )}

      <CityMap
        bairros={bairros}
        scores={scores}
        onSelectBairro={setSelectedBairro}
      />

      {selected && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
          <h2 className="text-lg font-bold">{selectedName}</h2>
          <p className="text-3xl font-bold" style={{ color: selected.color }}>
            {selected.overall}
          </p>
          <p className="text-sm text-zinc-400">{selected.label}</p>
          <p className="text-xs text-zinc-500">
            Melhor que {selected.percentile}% dos bairros
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify the app runs**

```bash
pnpm dev
```
Expected: Opens browser to localhost:3000 showing a dark map of Curitiba. After data loads (~5-15s), 75 neighborhoods appear colored green-to-red. Hovering shows tooltip. Clicking shows score overlay.

- [ ] **Step 6: Run biome check**

```bash
pnpm check
```
Fix any formatting/lint issues.

- [ ] **Step 7: Run all tests**

```bash
pnpm test
```
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: wire up main page with header, layout, and interactive map"
```

---

## Phase 2: Detail Panel + Search + Radar Chart

### Task 2.1: Add shadcn/ui components needed

- [ ] **Step 1: Install components**

```bash
pnpm dlx shadcn@latest add card badge separator collapsible sheet input scroll-area tooltip skeleton
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui components for panel"
```

### Task 2.2: Implement Nominatim search

**Files:**
- Modify: `src/lib/api/nominatim.ts` (replace stub)
- Create: `src/components/search/address-search.tsx`

- [ ] **Step 1: Implement full Nominatim client**

Replace the stub with a throttled, cached implementation:
- `searchAddress(query: string): Promise<NominatimResult[]>`
- Scoped to Curitiba, PR
- Throttle: 1 request per second
- Cache results in localStorage
- Debounce handled by the component (300ms)

- [ ] **Step 2: Implement address-search.tsx**

Floating search input over the map:
- Input with 300ms debounce
- Dropdown showing up to 5 results
- On select: callback with coordinates
- Clear button to dismiss

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/nominatim.ts src/components/search/
git commit -m "feat: implement address search with Nominatim"
```

### Task 2.3: Implement radius rings

**Files:**
- Create: `src/components/map/radius-rings.tsx`

- [ ] **Step 1: Implement radius rings**

Three `<Circle>` components at 500m, 1km, 2km from a searched point. Dashed stroke, semi-transparent, with distance label.

- [ ] **Step 2: Commit**

```bash
git add src/components/map/radius-rings.tsx
git commit -m "feat: add radius rings for address search"
```

### Task 2.4: Implement neighborhood panel components

**Files:**
- Create: `src/components/panel/score-gauge.tsx`, `src/components/panel/radar-chart.tsx`, `src/components/panel/category-card.tsx`, `src/components/panel/strengths-weaknesses.tsx`, `src/components/panel/nearby-services.tsx`, `src/components/panel/neighborhood-panel.tsx`

- [ ] **Step 1: Write score-gauge.tsx**

SVG circular gauge: `stroke-dasharray` proportional to score, large number in center, label below, color coded, "Melhor que X% dos bairros" subtitle.

- [ ] **Step 2: Write radar-chart.tsx**

Recharts `<RadarChart>` with 7 axes. Two datasets: selected bairro (accent color) and city average (gray/muted). Portuguese labels.

- [ ] **Step 3: Write category-card.tsx**

Expandable card (shadcn Collapsible). Header: icon, category name, score, color bar. Expanded: each factor with raw value and score, facility list with names and distances.

- [ ] **Step 4: Write strengths-weaknesses.tsx**

Sort categories by score. Top 2 as green badges, bottom 2 as red. One-line summary from templates.

- [ ] **Step 5: Write nearby-services.tsx**

Facilities grouped by category, sorted by distance, capped at 5 with "ver mais" expansion.

- [ ] **Step 6: Write neighborhood-panel.tsx**

Desktop: sidebar 35% width right, slides in. Mobile: Sheet with side="bottom". Composes: ScoreGauge, RadarChart, StrengthsWeaknesses, CategoryCards, NearbyServices. ScrollArea for overflow. Loading skeletons.

- [ ] **Step 7: Commit**

```bash
git add src/components/panel/
git commit -m "feat: implement neighborhood detail panel with radar chart and category breakdown"
```

### Task 2.5: Implement service markers and map controls

**Files:**
- Create: `src/components/map/service-markers.tsx`, `src/components/map/map-controls.tsx`

- [ ] **Step 1: Install react-leaflet-cluster**

```bash
pnpm add react-leaflet-cluster
```

- [ ] **Step 2: Write service-markers.tsx**

Markers per category with distinct SVG icons. Cluster for bus stops. Popup on click.

- [ ] **Step 3: Write map-controls.tsx**

Layer visibility toggles as floating checkboxes on the map.

- [ ] **Step 4: Commit**

```bash
git add src/components/map/service-markers.tsx src/components/map/map-controls.tsx
git commit -m "feat: add service markers with clustering and layer controls"
```

### Task 2.6: Wire everything into main page

**Files:**
- Modify: `src/app/page.tsx`, `src/components/map/city-map.tsx`

- [ ] **Step 1: Update page.tsx**

Integrate AddressSearch, NeighborhoodPanel, state for `selectedBairro`, `searchedPoint`, `visibleLayers`. Panel opens on bairro click or address search. Radius rings on search.

- [ ] **Step 2: Update city-map.tsx**

Add ServiceMarkers, RadiusRings, MapControls as children. Accept new props for visibility/search state. Add `useMap()` for fly-to on search.

- [ ] **Step 3: Verify**

```bash
pnpm dev
```
Expected: Search works, panel opens with radar chart, markers toggleable.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: integrate search, panel, markers into main page"
```

---

## Phase 3: Ranking, Compare, Methodology, Polish

### Task 3.1: Implement compare view

**Files:**
- Create: `src/components/panel/compare-view.tsx`
- Modify: `src/components/panel/neighborhood-panel.tsx`

- [ ] **Step 1: Write compare-view.tsx**

Side-by-side layout: two score gauges, category bars, overlaid radar chart, per-category winner arrows, summary line.

- [ ] **Step 2: Add "Comparar" button to neighborhood-panel.tsx**

When clicked, user selects a second bairro on the map. CompareView replaces the normal panel content.

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/
git commit -m "feat: add compare mode for two neighborhoods"
```

### Task 3.2: Implement ranking page

**Files:**
- Create: `src/components/ranking/ranking-table.tsx`, `src/app/ranking/page.tsx`

- [ ] **Step 1: Install shadcn Table**

```bash
pnpm dlx shadcn@latest add table select
```

- [ ] **Step 2: Write ranking-table.tsx**

Sortable table: position, nome, regional, overall score, 7 category mini-bars. Filterable by regional (dropdown). Searchable by name. Row click → navigate to `/?bairro={codigo}`.

- [ ] **Step 3: Write ranking page.tsx**

Client component wrapper using useScores. Page metadata for SEO.

- [ ] **Step 4: Commit**

```bash
git add src/components/ranking/ src/app/ranking/
git commit -m "feat: add ranking page with sortable table"
```

### Task 3.3: Implement methodology page

**Files:**
- Create: `src/app/metodologia/page.tsx`

- [ ] **Step 1: Write methodology page**

Static content explaining: purpose, formula, each category (factors, weights, thresholds from CLAUDE.md), data sources with IPPUC links, last update date, table of contents with anchor links.

- [ ] **Step 2: Commit**

```bash
git add src/app/metodologia/
git commit -m "feat: add methodology page"
```

### Task 3.4: URL state and deep linking

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add URL query param support**

Read `?bairro=codigo` on mount → select bairro, center map, open panel. Read `?compare=a,b` → open compare mode. Ranking rows navigate with these params.

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add URL deep linking for bairro and compare"
```

### Task 3.5: Theme toggle

**Files:**
- Modify: `src/app/layout.tsx`, `src/components/layout/header.tsx`, `src/components/map/city-map.tsx`

- [ ] **Step 1: Add ThemeProvider**

Wrap layout with `next-themes` ThemeProvider.

- [ ] **Step 2: Add toggle button to header**

Sun/moon icon toggle.

- [ ] **Step 3: Theme-aware map tiles**

Switch between CartoDB Dark Matter and Positron based on theme.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add dark/light theme toggle"
```

### Task 3.6: Footer and polish

**Files:**
- Create: `src/components/layout/footer.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write footer**

Credits IPPUC, links to methodology, "Feito em Curitiba".

- [ ] **Step 2: Polish pass**

Loading skeletons throughout, error boundaries, responsive mobile check, accessibility (ARIA labels), console cleanup.

- [ ] **Step 3: Final build verification**

```bash
pnpm build
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add footer and polish pass"
```

---

## Verification

After all phases complete:

1. `pnpm dev` — map loads, neighborhoods colored, hover/click work
2. Address search → fly-to, radius rings, panel opens
3. Panel shows: score gauge, 7-axis radar, expandable category cards, strengths/weaknesses
4. "Comparar" → select second bairro → side-by-side comparison
5. `/ranking` — sortable table, filter by regional, click navigates to map
6. `/metodologia` — all sections render, anchor links work
7. Theme toggle switches map tiles + UI
8. `/?bairro=CENTRO` deep link works
9. Mobile: bottom sheet, responsive layout
10. `pnpm test` — all pass
11. `pnpm build` — no errors
