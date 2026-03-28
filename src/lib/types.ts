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
  properties?: Record<string, string | number | null>
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
  lineNumber?: string
  lineType?: string
}

export interface BairroCrimeData {
  bairro: string
  totalOcorrencias12m: number
  ocorrenciasPorKm2: number
  naturezas: Record<string, number>
  topNaturezas: { nome: string; count: number }[]
  tendencia: 'subindo' | 'estavel' | 'descendo'
  scorePercentil: number // 0-100 score based on percentile ranking (higher = safer)
}

export interface TransportMeta {
  total: number
  paradas: number
  terminais: number
}

export type ServiceCounts = Record<string, number>

export interface HomePageDataPayload {
  bairros: Bairro[]
  scores: BairroScore[]
  cityAverage: Record<string, number> | null
  services: Record<string, ServiceFacility[]>
  serviceCounts: ServiceCounts
  transportMeta: TransportMeta
}

export interface RankingPageDataPayload extends HomePageDataPayload {
  greenAreas: GreenArea[]
  crimeData: BairroCrimeData[]
}
