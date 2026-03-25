# Meu Bairro CWB

Build a polished, interactive web app called **Meu Bairro CWB** — a neighborhood quality-of-life explorer for Curitiba. The user picks a bairro or searches an address and gets a detailed livability score based on real public data: health, education, safety, transport, green areas, culture, and more. All data from the official IPPUC/GeoCuritiba ArcGIS API.

## The Product

A map-centric app focused on answering one question: **"Is this a good place to live?"** — backed by real data, not opinions. Each of Curitiba's 75 neighborhoods gets a multi-factor livability score. Users can explore the map, compare neighborhoods, and drill into what makes each one score high or low.

## Tech Stack

- **Framework:** Next.js 15 (App Router, RSC)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS v4 + shadcn/ui
- **Maps:** Leaflet + React Leaflet (OpenStreetMap tiles, no API key)
- **Data Source:** IPPUC GeoCuritiba ArcGIS REST API (public, no auth required)
- **Geocoding:** Nominatim (OpenStreetMap, free) for address lookup
- **Charts:** Recharts (radar chart for score breakdown)
- **Deployment:** Vercel
- **Linting:** Biome

## Data Sources

### Neighborhood Boundaries (official, current)

**IPPUC ArcGIS — MapaCadastral Layer 2 (Bairro):**
```
https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/2/query?where=1%3D1&outFields=*&outSR=4326&f=geojson
```
Returns all 75 bairros with: `nome`, `codigo`, `cd_regional`, `nm_regional`, geometry polygons.

Also available:
- Layer 3: Regionais (admin regions)
- Layer 4: Micro Bairro Cadastral (sub-neighborhoods)

### Urban Equipment (services/facilities)

**Base URL:** `https://geocuritiba.ippuc.org.br/server/rest/services/Publico_GeoCuritiba_Equipamentos_Urbanos/MapServer`

Query pattern: `.../MapServer/{layerId}/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`

#### Health (Saúde)
| Layer | Name |
|-------|------|
| 129 | Hospital público |
| 130 | UPA (Pronto Atendimento) |
| 134 | UBS (Unidade de Saúde) |
| 132 | Centro de Especialidades Médicas |
| 135 | CAPS (Saúde Mental) |

#### Education (Educação)
| Layer | Name |
|-------|------|
| 78 | CMEI (Educação Infantil) |
| 80 | Escola Municipal |
| 81 | Centro de Atendimento Educacional Especializado |

#### Safety (Segurança)
| Layer | Name |
|-------|------|
| 142 | Polícia Militar |
| 143 | Polícia Civil (delegacias) |
| 144 | Corpo de Bombeiros |
| 138 | Guarda Municipal — Núcleo Regional |

#### Transport (Transporte)
Service: `.../GeoCuritiba/URBS_Transporte_Publico/MapServer`
| Layer | Name |
|-------|------|
| 0 | Terminais de ônibus |
| 1 | Paradas de ônibus |
| 2 | Linhas de ônibus |

#### Leisure & Green Areas (Lazer)
Available via IPPUC shapefiles and ArcGIS conservation layer:
`.../GeoCuritiba/Publico_Sistema_Municipal_de_Unidades_de_Conservacao/FeatureServer`

#### Culture & Sports
Explore remaining layers in the Equipamentos Urbanos MapServer (159 total layers) for: libraries, museums, sports facilities, community centers, etc.

### Geocoding (address search)
Nominatim: `https://nominatim.openstreetmap.org/search?q={address},+Curitiba,+PR&format=json&limit=5`
Rate limit: 1 req/sec. Cache results.

---

## The Livability Score System

This is the core of the app. Each neighborhood gets a **0-100 overall score** composed of weighted category scores.

### Score Categories

#### 1. Saúde (Health) — Weight: 20%
What it measures: access to healthcare facilities.

| Factor | How to measure | Scoring |
|--------|---------------|---------|
| Nearest UBS | Distance from bairro centroid | <500m: 100, <1km: 80, <2km: 50, <3km: 20, >3km: 5 |
| Nearest hospital or UPA | Distance | <1km: 100, <2km: 80, <3km: 60, <5km: 30, >5km: 5 |
| Health facility density | Count within bairro + 1km buffer | ≥5: 100, 4: 80, 3: 60, 2: 40, 1: 20, 0: 0 |

Category score = weighted average of factors (40% nearest UBS, 35% nearest hospital/UPA, 25% density).

#### 2. Educação (Education) — Weight: 18%
What it measures: access to public schools and childcare.

| Factor | How to measure | Scoring |
|--------|---------------|---------|
| Nearest escola municipal | Distance | <500m: 100, <1km: 80, <1.5km: 50, <2km: 30, >2km: 5 |
| Nearest CMEI | Distance | <500m: 100, <1km: 80, <1.5km: 50, <2km: 30, >2km: 5 |
| Education facility density | Count within bairro + 1km buffer | ≥6: 100, 4-5: 80, 3: 60, 2: 40, 1: 20, 0: 0 |

Category score = average of all three factors.

#### 3. Segurança (Safety) — Weight: 17%
What it measures: proximity to police, fire, and municipal guard stations.

| Factor | How to measure | Scoring |
|--------|---------------|---------|
| Nearest PM or Guarda Municipal | Distance | <1km: 100, <2km: 70, <3km: 40, >3km: 10 |
| Nearest delegacia (Polícia Civil) | Distance | <2km: 100, <3km: 70, <5km: 40, >5km: 10 |
| Nearest Corpo de Bombeiros | Distance | <2km: 100, <3km: 70, <5km: 40, >5km: 10 |
| Security presence density | Count all security facilities within 2km | ≥4: 100, 3: 75, 2: 50, 1: 25, 0: 0 |

Category score = weighted average (35% PM/Guarda, 25% delegacia, 20% bombeiros, 20% density).

#### 4. Transporte (Transport) — Weight: 18%
What it measures: access to public transportation.

| Factor | How to measure | Scoring |
|--------|---------------|---------|
| Bus stop density within 500m | Count | ≥15: 100, 10-14: 85, 5-9: 65, 2-4: 40, 1: 20, 0: 0 |
| Nearest bus terminal | Distance | <500m: 100, <1km: 80, <2km: 60, <3km: 30, >3km: 10 |
| Bus route variety | Unique lines passing through bairro | ≥10: 100, 7-9: 80, 4-6: 60, 2-3: 35, 1: 15, 0: 0 |

Category score = weighted average (45% stop density, 30% terminal proximity, 25% route variety).

#### 5. Áreas Verdes (Green Areas) — Weight: 12%
What it measures: access to parks, forests, and green spaces.

| Factor | How to measure | Scoring |
|--------|---------------|---------|
| Nearest park or bosque | Distance | <300m: 100, <500m: 85, <1km: 65, <2km: 35, >2km: 10 |
| Green area coverage | % of bairro area that is green/conservation | >15%: 100, 10-15%: 80, 5-10%: 55, 1-5%: 30, <1%: 5 |
| Park count within 2km | Count | ≥4: 100, 3: 75, 2: 50, 1: 25, 0: 0 |

Category score = weighted average (40% nearest, 35% coverage, 25% count).

#### 6. Cultura & Esporte (Culture & Sports) — Weight: 8%
What it measures: access to libraries, museums, sports facilities, community centers.

| Factor | How to measure | Scoring |
|--------|---------------|---------|
| Culture/sports facility density | Count within bairro + 1km | ≥5: 100, 3-4: 75, 2: 50, 1: 25, 0: 0 |
| Nearest facility | Distance | <500m: 100, <1km: 70, <2km: 40, >2km: 10 |

Category score = average of both factors.

#### 7. Diversidade de Serviços (Service Variety) — Weight: 7%
What it measures: how many DIFFERENT types of essential services are accessible.

Check if the bairro has at least one of each within a reasonable radius:
- Health facility (UBS/hospital/UPA) within 2km
- School (municipal/CMEI) within 1.5km
- Security (PM/delegacia/bombeiros) within 3km
- Bus stop within 500m
- Park/green area within 1km
- Culture/sports facility within 2km

Scoring: 6/6 categories present = 100, 5/6 = 80, 4/6 = 60, 3/6 = 40, 2/6 = 20, ≤1 = 5.

### Overall Score

```
overall = (saúde × 0.20) + (educação × 0.18) + (segurança × 0.17) + (transporte × 0.18) + (áreas_verdes × 0.12) + (cultura × 0.08) + (diversidade × 0.07)
```

### Score Labels
| Score | Label | Color |
|-------|-------|-------|
| 85-100 | Excelente | Emerald green |
| 70-84 | Muito Bom | Green |
| 55-69 | Bom | Yellow-green |
| 40-54 | Regular | Yellow |
| 25-39 | Abaixo da Média | Orange |
| 0-24 | Crítico | Red |

---

## Features

### 1. Interactive Map
- Full-screen Leaflet map centered on Curitiba
- All 75 bairro boundaries drawn as polygons
- **Choropleth coloring** by overall livability score (green = high, red = low)
- Click any neighborhood to select and open detail panel
- Service markers with distinct icons per category (toggleable layers)
- Dark map tiles (CartoDB Dark Matter) by default

### 2. Address Search
- Search bar floating on top of the map
- Autocomplete via Nominatim (debounced, Curitiba-scoped)
- On search: fly to location, highlight neighborhood, show detail panel
- Show radius rings (500m, 1km, 2km) from searched point

### 3. Neighborhood Detail Panel (sidebar / bottom sheet on mobile)

**Header:**
- Bairro name + Regional
- Overall score as large number with color-coded ring/gauge
- Score label ("Muito Bom", "Regular", etc.)
- "Melhor que X% dos bairros" comparison line

**Radar Chart:**
- 6-axis radar chart showing each category score
- Overlay with city average for comparison

**Category Breakdown (expandable cards):**
Each category shows:
- Category score (0-100) with small color bar
- Key stats: "UBS mais próxima: 450m", "12 paradas de ônibus em 500m"
- What scored well, what scored poorly
- List of actual facilities with names and distances

**Strengths & Weaknesses:**
- Top 2 strongest categories highlighted in green
- Top 2 weakest categories highlighted in orange/red
- One-line summary: "Ótimo transporte público, mas carente em áreas verdes"

### 4. Compare Mode
- Button to "Comparar com outro bairro"
- Split view: two panels side by side
- Radar charts overlaid on same axes
- Each category shows which bairro wins with arrow indicator
- Summary: "Bairro A é melhor em 4/6 categorias"

### 5. Ranking Page (`/ranking`)
- Table of all 75 bairros sorted by overall score
- Columns: position, bairro, regional, overall score, each category score (as small colored bars)
- Sortable by any column
- Filterable by regional
- Search/filter by name
- Click row → navigate to map with that bairro selected

### 6. Methodology Page (`/metodologia`)
- Explain every factor, weight, and scoring threshold
- Transparent — user should understand exactly how scores are calculated
- List all data sources with links to IPPUC
- Last data refresh date

---

## UI / UX

### Layout
- Map takes ~65% of screen (desktop), full width on mobile
- Sidebar on right for details (slides in/out)
- Mobile: bottom sheet that swipes up, map underneath
- Top bar: logo, search bar, links to ranking and methodology

### Design
- Dark theme default, light toggle
- Score colors are the visual identity — green to red gradient everywhere
- Smooth map transitions (fly-to, zoom)
- Loading skeletons while API data loads
- All text in Brazilian Portuguese

### Data Loading Strategy
- On mount: fetch bairro boundaries (small, ~200KB GeoJSON)
- Then fetch all service layers in parallel (each ~50-200KB)
- Compute all 75 scores client-side
- Cache everything in localStorage with 7-day TTL
- On return visits: instant load from cache, background refresh
- All distance math is Haversine, runs client-side

---

## File Structure

```
meu-bairro-cwb/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Main map page
│   │   ├── ranking/page.tsx                # Rankings table
│   │   ├── metodologia/page.tsx            # Methodology explanation
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                             # shadcn/ui
│   │   ├── map/
│   │   │   ├── city-map.tsx                # Main Leaflet map wrapper
│   │   │   ├── neighborhood-layer.tsx      # GeoJSON polygons + choropleth
│   │   │   ├── service-markers.tsx         # Markers by category
│   │   │   ├── radius-rings.tsx            # Distance circles
│   │   │   └── map-controls.tsx            # Zoom, layer toggles
│   │   ├── search/
│   │   │   └── address-search.tsx          # Autocomplete
│   │   ├── panel/
│   │   │   ├── neighborhood-panel.tsx      # Main sidebar/sheet
│   │   │   ├── score-gauge.tsx             # Overall score ring
│   │   │   ├── radar-chart.tsx             # 6-axis category chart
│   │   │   ├── category-card.tsx           # Expandable per-category detail
│   │   │   ├── strengths-weaknesses.tsx    # Highlights
│   │   │   ├── nearby-services.tsx         # Facility list with distances
│   │   │   └── compare-view.tsx            # Side-by-side comparison
│   │   ├── ranking/
│   │   │   └── ranking-table.tsx           # Sortable table
│   │   └── layout/
│   │       ├── header.tsx
│   │       └── footer.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── geocuritiba.ts              # Fetch + parse ArcGIS layers
│   │   │   ├── nominatim.ts                # Address geocoding
│   │   │   └── layers.ts                   # Layer IDs, URLs, category config
│   │   ├── geo/
│   │   │   ├── haversine.ts                # Distance between two points
│   │   │   ├── centroid.ts                 # Calculate polygon centroid
│   │   │   ├── point-in-polygon.ts         # Which bairro a point belongs to
│   │   │   └── nearest.ts                  # Find N nearest points
│   │   ├── score/
│   │   │   ├── calculator.ts               # Main score engine
│   │   │   ├── health.ts                   # Health category scorer
│   │   │   ├── education.ts                # Education category scorer
│   │   │   ├── safety.ts                   # Safety category scorer
│   │   │   ├── transport.ts                # Transport category scorer
│   │   │   ├── green.ts                    # Green areas category scorer
│   │   │   ├── culture.ts                  # Culture & sports scorer
│   │   │   ├── variety.ts                  # Service variety scorer
│   │   │   └── weights.ts                  # Weight config (easily adjustable)
│   │   ├── cache.ts                        # localStorage cache with TTL
│   │   └── types.ts
│   └── hooks/
│       ├── use-bairros.ts                  # Fetch + cache bairro boundaries
│       ├── use-services.ts                 # Fetch + cache service layers
│       └── use-scores.ts                   # Compute + cache all scores
├── public/
│   └── markers/                            # Custom marker SVG icons
├── package.json
├── tsconfig.json
├── next.config.ts
├── biome.json
└── CLAUDE.md
```
