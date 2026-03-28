import { describe, expect, it } from 'vitest'
import type {
  Bairro,
  BairroCrimeData,
  BusLine,
  GreenArea,
  ServiceFacility,
} from '@/lib/types'
import {
  buildHomePageDataPayload,
  buildRankingPageDataPayload,
} from '../city-data'

function makeBairro(): Bairro {
  return {
    codigo: '1',
    nome: 'Centro',
    nmRegional: 'Matriz',
    cdRegional: '1',
    centroid: [-25.43, -49.27],
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-49.28, -25.44],
          [-49.26, -25.44],
          [-49.26, -25.42],
          [-49.28, -25.42],
          [-49.28, -25.44],
        ],
      ],
    },
  }
}

function makeFacility(
  id: string,
  category: ServiceFacility['category'],
  subcategory: string,
  coordinates: [number, number],
): ServiceFacility {
  return {
    id,
    name: `${subcategory} ${id}`,
    category,
    subcategory,
    coordinates,
    layerId: 1,
  }
}

function makeBusLine(id: string): BusLine {
  return {
    id,
    name: `Linha ${id}`,
    coordinates: [
      [-25.431, -49.271],
      [-25.429, -49.269],
    ],
  }
}

function makeGreenArea(id: string): GreenArea {
  return {
    id,
    name: `Parque ${id}`,
    type: 'Parque',
    layerId: 1,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-49.281, -25.441],
          [-49.279, -25.441],
          [-49.279, -25.439],
          [-49.281, -25.439],
          [-49.281, -25.441],
        ],
      ],
    },
  }
}

function makeCrimeData(): BairroCrimeData {
  return {
    bairro: 'Centro',
    totalOcorrencias12m: 100,
    ocorrenciasPorKm2: 10,
    naturezas: { Furto: 50 },
    topNaturezas: [{ nome: 'Furto', count: 50 }],
    tendencia: 'estavel',
    scorePercentil: 60,
  }
}

describe('buildHomePageDataPayload', () => {
  it('keeps real transport totals and omits raw bus line payloads', () => {
    const bairro = makeBairro()
    const services: Record<string, ServiceFacility[]> = {
      saude: [makeFacility('s1', 'saude', 'Hospital', [-25.43, -49.27])],
      educacao: [],
      seguranca: [],
      transporte: [
        makeFacility('t1', 'transporte', 'Terminal', [-25.43, -49.27]),
        makeFacility('p1', 'transporte', 'Parada', [-25.431, -49.271]),
        makeFacility('p2', 'transporte', 'Parada', [-25.432, -49.272]),
      ],
      cultura: [],
    }

    const payload = buildHomePageDataPayload({
      bairros: [bairro],
      services,
      greenAreas: [],
      busLines: [makeBusLine('1')],
      crimeData: [],
    })

    expect(payload.serviceCounts.transporte).toBe(3)
    expect(payload.transportMeta).toEqual({
      total: 3,
      paradas: 2,
      terminais: 1,
    })
    expect(payload.scores).toHaveLength(1)
    expect(payload.bairros).toHaveLength(1)
    expect(payload.services.transporte).toHaveLength(3)
    expect(payload).not.toHaveProperty('busLines')
  })
})

describe('buildRankingPageDataPayload', () => {
  it('includes ranking-only datasets while preserving computed scores', () => {
    const payload = buildRankingPageDataPayload({
      bairros: [makeBairro()],
      services: {
        saude: [],
        educacao: [],
        seguranca: [],
        transporte: [
          makeFacility('t1', 'transporte', 'Terminal', [-25.43, -49.27]),
        ],
        cultura: [],
      },
      greenAreas: [makeGreenArea('1')],
      busLines: [makeBusLine('1')],
      crimeData: [makeCrimeData()],
    })

    expect(payload.greenAreas).toHaveLength(1)
    expect(payload.crimeData).toHaveLength(1)
    expect(payload.scores).toHaveLength(1)
    expect(payload.transportMeta.terminais).toBe(1)
  })
})
