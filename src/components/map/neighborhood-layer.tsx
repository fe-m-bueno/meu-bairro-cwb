'use client'

import type { Layer, LeafletMouseEvent } from 'leaflet'
import { useMemo } from 'react'
import { GeoJSON } from 'react-leaflet'
import { getScoreLabel } from '@/lib/score/weights'
import type { Bairro, BairroScore } from '@/lib/types'

interface NeighborhoodLayerProps {
  bairros: Bairro[]
  scores: BairroScore[]
  onSelectBairro: (codigo: string) => void
}

export function NeighborhoodLayer({
  bairros,
  scores,
  onSelectBairro,
}: NeighborhoodLayerProps) {
  const scoreMap = useMemo(() => {
    const map = new Map<string, BairroScore>()
    for (const score of scores) {
      map.set(score.bairroCode, score)
    }
    return map
  }, [scores])

  const geojsonKey = useMemo(() => {
    if (scores.length === 0) return 'empty'
    const sum = scores.reduce((acc, s) => acc + s.overall, 0)
    return `${scores.length}-${sum}`
  }, [scores])

  const geojsonData = useMemo((): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: bairros.map((bairro) => ({
        type: 'Feature' as const,
        properties: {
          codigo: bairro.codigo,
          nome: bairro.nome,
          nmRegional: bairro.nmRegional,
        },
        geometry: bairro.geometry,
      })),
    }
  }, [bairros])

  function style(feature: GeoJSON.Feature | undefined) {
    const codigo = feature?.properties?.codigo as string | undefined
    const score = codigo ? scoreMap.get(codigo) : undefined
    return {
      fillColor: score ? getScoreLabel(score.overall).color : '#374151',
      fillOpacity: 0.6,
      weight: 1,
      color: '#374151',
    }
  }

  function onEachFeature(feature: GeoJSON.Feature, layer: Layer) {
    const codigo = feature.properties?.codigo as string
    const nome = feature.properties?.nome as string
    const score = scoreMap.get(codigo)

    const tooltipContent = score
      ? `<strong>${nome}</strong><br/>Score: ${Math.round(score.overall)} - ${score.label}`
      : `<strong>${nome}</strong>`

    layer.bindTooltip(tooltipContent)

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target
        target.setStyle({
          weight: 3,
          color: '#ffffff',
          fillOpacity: 0.8,
        })
        target.bringToFront()
      },
      mouseout: (e: LeafletMouseEvent) => {
        const target = e.target
        const s = scoreMap.get(codigo)
        target.setStyle({
          weight: 1,
          color: '#374151',
          fillOpacity: 0.6,
          fillColor: s ? getScoreColor(s.overall) : '#374151',
        })
      },
      click: () => {
        onSelectBairro(codigo)
      },
    })
  }

  if (bairros.length === 0) return null

  return (
    <GeoJSON
      key={geojsonKey}
      data={geojsonData}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}
