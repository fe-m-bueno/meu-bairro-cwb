# Meu Bairro CWB — Design Spec

## Purpose

Build a neighborhood livability explorer for Curitiba that answers "Is this a good place to live?" using real public data from IPPUC/GeoCuritiba. Each of Curitiba's 75 neighborhoods gets a 0-100 multi-factor score based on proximity and density of public services.

## Architecture Overview

**Client-side SPA** built with Next.js 15 App Router. All data fetching, scoring, and geo calculations happen in the browser. Data is cached in localStorage with 7-day TTL.

```
User → Next.js page (SSR shell) → Client hydration → Fetch APIs → Compute scores → Render map + UI
                                                          ↓
                                              localStorage cache (7-day TTL)
```

### Data Flow

1. On mount: fetch bairro boundaries GeoJSON (~200KB) from IPPUC ArcGIS
2. Fetch all service layers in parallel (health, education, safety, transport, green, culture)
3. Normalize facilities into typed `ServiceFacility[]` arrays
4. For each of 75 bairros: compute centroid, run 7 category scorers, produce `BairroScore`
5. Render choropleth map colored by overall score
6. Cache raw data + computed scores in localStorage

### Key Boundary: SSR vs Client

Leaflet requires `window`. The SSR boundary is at `page.tsx` which uses `dynamic(() => import('./city-map'), { ssr: false })`. Everything under `city-map.tsx` is client-only.

## Spec Decisions (beyond CLAUDE.md)

These are decisions made in this spec that are not in the original requirements:
- **pnpm** as package manager (CLAUDE.md does not specify)
- **Vitest** as test framework (CLAUDE.md does not specify)
- **@turf/intersect + @turf/area** for green area coverage polygon math
- **7-axis radar chart** (CLAUDE.md says 6-axis, but Diversidade is the 7th category and should be visible)
- **next-themes** for dark/light mode toggling
- **300ms debounce** for Nominatim search (CLAUDE.md says "debounced" without specifying timing)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS v4 + shadcn/ui |
| Maps | Leaflet + React Leaflet |
| Charts | Recharts (RadarChart) |
| Geo math | Custom haversine + @turf/intersect for polygon overlap |
| Linting | Biome |
| Testing | Vitest (unit tests for scorers + geo utils) |
| Package manager | pnpm |

## Core Data Model

### Bairro
```typescript
interface Bairro {
  codigo: string
  nome: string
  nmRegional: string
  cdRegional: string
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  centroid: [number, number] // [lat, lng]
}
```

### ServiceFacility
```typescript
interface ServiceFacility {
  id: string
  name: string
  category: CategoryKey
  subcategory: string // e.g., "UBS", "Hospital", "CMEI"
  coordinates: [number, number] // [lat, lng]
  layerId: number
}
```

### BairroScore
```typescript
interface BairroScore {
  bairroCode: string
  overall: number // 0-100
  label: string // "Excelente", "Muito Bom", etc.
  color: string // hex color
  categories: Record<CategoryKey, CategoryScore>
  rank: number // 1-75
  percentile: number // 0-100
}
```

### CategoryKey
```typescript
type CategoryKey = 'saude' | 'educacao' | 'seguranca' | 'transporte' | 'areasVerdes' | 'cultura' | 'diversidade'
```

## Scoring System

### Design Principle
All scorers are **pure functions**: `(centroid, facilities) => CategoryScore`. No side effects, no API calls, no state. This makes them trivially testable and composable.

### Categories and Weights
| Category | Weight | Key Factors |
|----------|--------|------------|
| Saude | 20% | Nearest UBS (40%), nearest hospital/UPA (35%), density within 1km (25%) |
| Educacao | 18% | Nearest escola (33%), nearest CMEI (33%), density within 1km (33%) |
| Seguranca | 17% | Nearest PM/Guarda (35%), nearest delegacia (25%), nearest bombeiros (20%), density within 2km (20%) |
| Transporte | 18% | Bus stops within 500m (45%), nearest terminal (30%), route variety (25%) |
| Areas Verdes | 12% | Nearest park (40%), coverage % via Turf.js (35%), count within 2km (25%) |
| Cultura | 8% | Density within 1km (50%), nearest facility (50%) |
| Diversidade | 7% | Boolean check for 6 service types within radius |

### Score Labels
| Range | Label | Color |
|-------|-------|-------|
| 85-100 | Excelente | Emerald green |
| 70-84 | Muito Bom | Green |
| 55-69 | Bom | Yellow-green |
| 40-54 | Regular | Yellow |
| 25-39 | Abaixo da Media | Orange |
| 0-24 | Critico | Red |

### Scoring Thresholds

Full distance-to-score and count-to-score threshold tables are defined in `CLAUDE.md` (sections "Score Categories" through "Service Variety"). Implementers MUST use `CLAUDE.md` as the source of truth for all threshold values. The spec does not duplicate them to avoid drift.

### Green Area Coverage
Uses `@turf/intersect` to compute actual polygon overlap between conservation areas and bairro boundaries, then `@turf/area` to calculate percentage. This gives precise coverage data rather than approximations.

## UI/UX Specifications

- **Language:** All UI text in Brazilian Portuguese
- **Theme:** Dark by default, light toggle available. Uses `next-themes`.
- **Map tiles:** CartoDB Dark Matter (dark mode), CartoDB Positron (light mode)
- **Layout (desktop):** Map ~65% width left, sidebar ~35% width right (slides in on selection)
- **Layout (mobile):** Map full width, bottom sheet swipes up for details
- **Top bar:** Logo "Meu Bairro CWB", search bar (center), nav links (Ranking, Metodologia), theme toggle
- **Loading:** Skeleton components while API data loads
- **Deployment:** Vercel

### Panel Content

- **Header:** Bairro name + Regional, overall score as large number with color ring, label, "Melhor que X% dos bairros"
- **Radar chart:** 7 axes (all categories), overlay with city average in muted gray
- **Category cards (expandable):** Score + color bar header. Expanded: factor details ("UBS mais proxima: 450m"), what scored well/poorly, facility list with names and distances
- **Strengths/weaknesses:** Top 2 green, bottom 2 red, one-line summary ("Otimo transporte publico, mas carente em areas verdes")
- **Compare mode:** "Comparar com outro bairro" button. Split view with two panels, overlaid radar, per-category winner arrows, summary "Bairro A e melhor em X/7 categorias"

## Component Architecture

### Map Layer (`src/components/map/`)
- `city-map.tsx` — Leaflet MapContainer, tile layer, hosts children. Client-only boundary.
- `neighborhood-layer.tsx` — GeoJSON choropleth. Score-to-color mapping. Click/hover handlers. Must use `key` prop that changes when scores update (React-Leaflet limitation).
- `service-markers.tsx` — Category-specific markers with clustering for dense layers (bus stops).
- `radius-rings.tsx` — 500m/1km/2km circles from searched point.
- `map-controls.tsx` — Layer visibility toggles.

### Panel (`src/components/panel/`)
- `neighborhood-panel.tsx` — Sidebar (desktop) / bottom sheet (mobile). Orchestrates sub-components.
- `score-gauge.tsx` — SVG circular gauge with score number and label.
- `radar-chart.tsx` — 7-axis Recharts RadarChart, bairro vs city average overlay.
- `category-card.tsx` — Expandable card per category showing factors and nearby facilities.
- `strengths-weaknesses.tsx` — Top 2 / bottom 2 categories with summary line.
- `nearby-services.tsx` — Grouped facility list sorted by distance.
- `compare-view.tsx` — Side-by-side two-bairro comparison.

### Search (`src/components/search/`)
- `address-search.tsx` — Floating input over map. Nominatim with 300ms debounce, 1req/sec throttle, Curitiba-scoped.

## Pages

| Route | Purpose | Rendering |
|-------|---------|-----------|
| `/` | Map + panel | Client (dynamic import for Leaflet) |
| `/ranking` | Sortable/filterable table of all 75 bairros | Client (needs score data) |
| `/metodologia` | Static explanation of scoring methodology | Server component (mostly static) |

## Caching Strategy

- Keys prefixed with `mbc:` (e.g., `mbc:bairros`, `mbc:services:saude`)
- Default TTL: 7 days
- On cache hit: return immediately, optionally refresh in background
- Computed scores also cached (key: `mbc:scores`)
- SSR-safe: checks `typeof window !== 'undefined'`

## API Integration

### ArcGIS Endpoints and Layer IDs

Three distinct ArcGIS MapServer endpoints are used:

**1. Neighborhood Boundaries (MapaCadastral)**
```
Base: https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer
Layer 2: Bairros (boundaries + metadata)
```

**2. Urban Equipment (Equipamentos Urbanos)**
```
Base: https://geocuritiba.ippuc.org.br/server/rest/services/Publico_GeoCuritiba_Equipamentos_Urbanos/MapServer
```
| Category | Subcategory | Layer ID |
|----------|------------|----------|
| Saude | Hospital publico | 129 |
| Saude | UPA | 130 |
| Saude | UBS | 134 |
| Saude | Centro Especialidades | 132 |
| Saude | CAPS | 135 |
| Educacao | CMEI | 78 |
| Educacao | Escola Municipal | 80 |
| Educacao | CAEE | 81 |
| Seguranca | Policia Militar | 142 |
| Seguranca | Policia Civil | 143 |
| Seguranca | Corpo de Bombeiros | 144 |
| Seguranca | Guarda Municipal | 138 |
| Cultura | Biblioteca (Farol do Saber + geral) | 63, 64 |
| Cultura | Museu | 54 |
| Cultura | Teatro | 55 |
| Cultura | Centro Cultural | 50 |
| Cultura | Casa da Leitura | 61 |
| Esporte | Centro de Esporte e Lazer | 86 |
| Esporte | Academia ao Ar Livre | 91 |
| Esporte | Clube da Gente | 85 |
| Esporte | Centro da Juventude | 88 |

**3. Transport (URBS — separate endpoint)**
```
Base: https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/URBS_Transporte_Publico/MapServer
```
| Subcategory | Layer ID |
|------------|----------|
| Terminais | 0 |
| Paradas | 1 |
| Linhas | 2 |

**4. Green Areas / Conservation**
```
Base: https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_Sistema_Municipal_de_Unidades_de_Conservacao/FeatureServer
```
| Type | Layer ID |
|------|----------|
| Estacao Ecologica | 1 |
| Parque Natural Municipal | 2 |
| Parque Linear | 3 |
| Bosque Municipal | 4 |
| Bosque de Conservacao | 5 |
| Refugio da Vida Silvestre | 6 |
| RPPNM | 7 |
| Especificas | 8 |
| APA (Area de Protecao Ambiental) | 10 |
| ARIE (Area de Relevante Interesse Ecologico) | 11 |

All queries use: `?where=1%3D1&outFields=*&outSR=4326&f=geojson`

### ArcGIS Pagination
The IPPUC API may return paginated results with `exceededTransferLimit: true`. The fetch function must loop with increasing `resultOffset` until all features are retrieved.

### Nominatim Rate Limiting
1 request per second maximum. Implemented via a throttle queue. Results cached in localStorage.
Endpoint: `https://nominatim.openstreetmap.org/search?q={address},+Curitiba,+PR&format=json&limit=5`

## Error Handling

- Individual service layer fetch failures don't block other layers (`Promise.allSettled`)
- Missing facilities for a category → that category scores 0
- Network errors show a retry banner, not a full error page
- Invalid geometries are skipped with console warning

## Performance Considerations

- Score computation for 75 bairros with thousands of facilities: pre-compute and cache
- `findWithinRadius` uses bounding box pre-filter before Haversine
- GeoJSON polygons loaded once, cached
- If scoring blocks UI (>100ms), move to Web Worker

## Delivery Phases

1. **Phase 0:** Project scaffold + tooling
2. **Phase 1:** Map + data layer + scoring engine + unit tests (core MVP)
3. **Phase 2:** Detail panel + address search + radar chart + service markers
4. **Phase 3:** Compare mode + ranking + methodology + theme toggle + polish
