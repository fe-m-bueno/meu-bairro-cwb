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

// NOTE: transporte only has Terminal (0) and Parada (1) here.
// Bus lines (layer 2) are LineString geometries fetched separately via fetchBusLines()
export const SERVICE_LAYERS: Record<string, LayerDef[]> = {
  saude: [
    { layerId: 129, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Hospital' },
    { layerId: 130, baseUrl: EQUIPAMENTOS_URL, subcategory: 'UPA' },
    { layerId: 134, baseUrl: EQUIPAMENTOS_URL, subcategory: 'UBS' },
    {
      layerId: 132,
      baseUrl: EQUIPAMENTOS_URL,
      subcategory: 'Centro de Especialidades',
    },
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
    {
      layerId: 144,
      baseUrl: EQUIPAMENTOS_URL,
      subcategory: 'Corpo de Bombeiros',
    },
    {
      layerId: 138,
      baseUrl: EQUIPAMENTOS_URL,
      subcategory: 'Guarda Municipal',
    },
  ],
  transporte: [
    { layerId: 0, baseUrl: TRANSPORTE_URL, subcategory: 'Terminal' },
    { layerId: 1, baseUrl: TRANSPORTE_URL, subcategory: 'Parada' },
  ],
  cultura: [
    { layerId: 63, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Farol do Saber' },
    { layerId: 64, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Biblioteca' },
    { layerId: 54, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Museu' },
    { layerId: 55, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Teatro' },
    { layerId: 50, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Centro Cultural' },
    { layerId: 61, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Casa da Leitura' },
    {
      layerId: 86,
      baseUrl: EQUIPAMENTOS_URL,
      subcategory: 'Centro de Esporte e Lazer',
    },
    {
      layerId: 91,
      baseUrl: EQUIPAMENTOS_URL,
      subcategory: 'Academia ao Ar Livre',
    },
    { layerId: 85, baseUrl: EQUIPAMENTOS_URL, subcategory: 'Clube da Gente' },
    {
      layerId: 88,
      baseUrl: EQUIPAMENTOS_URL,
      subcategory: 'Centro da Juventude',
    },
  ],
}

export const GREEN_AREA_LAYERS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11]

// Re-export CategoryKey so callers can import from here if needed
export type { CategoryKey }
