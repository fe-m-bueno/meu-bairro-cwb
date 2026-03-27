'use client'

import type L from 'leaflet'
import type { Layer, LeafletMouseEvent } from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { GeoJSON } from 'react-leaflet'
import { getScoreLabel } from '@/lib/score/weights'
import type { Bairro, BairroScore, CategoryKey } from '@/lib/types'

interface NeighborhoodLayerProps {
  bairros: Bairro[]
  scores: BairroScore[]
  onSelectBairro: (codigo: string) => void
}

function buildTooltipContent(
  nome: string,
  feature: GeoJSON.Feature,
  score: BairroScore | undefined,
): string {
  if (!score) return `<strong>${nome}</strong>`

  return `<div style="min-width:200px;font-family:system-ui;">
    <div style="font-weight:700;font-size:15px;margin-bottom:2px;letter-spacing:-0.01em;">${nome}</div>
    <div style="font-size:11px;opacity:0.6;margin-bottom:8px;">${feature.properties?.nmRegional || ''}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
      <span style="font-size:22px;font-weight:800;color:${score.color}">${Math.round(score.overall)}</span>
      <div>
        <div style="font-size:12px;color:${score.color};font-weight:600;">${score.label}</div>
        <div style="font-size:10px;opacity:0.5;">${score.rank}º de 75 bairros</div>
      </div>
    </div>
    <hr style="border:0;border-top:1px solid rgba(128,128,128,0.2);margin:6px 0;"/>
    <div style="display:flex;flex-direction:column;gap:3px;">
      ${(
        [
          'saude',
          'educacao',
          'seguranca',
          'transporte',
          'areasVerdes',
          'cultura',
        ] as CategoryKey[]
      )
        .map((key) => {
          const cat = score.categories[key]
          if (!cat) return ''
          const catName: Record<string, string> = {
            saude: 'Saúde',
            educacao: 'Educação',
            seguranca: 'Segurança',
            transporte: 'Transporte',
            areasVerdes: 'Áreas Verdes',
            cultura: 'Cultura',
          }
          const barColor =
            cat.score >= 70
              ? '#22c55e'
              : cat.score >= 40
                ? '#eab308'
                : '#ef4444'
          return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;">
          <span style="width:74px;opacity:0.7;">${catName[key]}</span>
          <div style="flex:1;height:5px;background:rgba(128,128,128,0.25);border-radius:3px;overflow:hidden;">
            <div style="width:${cat.score}%;height:100%;background:${barColor};border-radius:3px;"></div>
          </div>
          <span style="width:24px;text-align:right;font-size:10px;opacity:0.7;">${Math.round(cat.score)}</span>
        </div>`
        })
        .join('')}
    </div>
  </div>`
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

  const geojsonKey = `bairros-${bairros.length}`

  const geojsonRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    if (!geojsonRef.current) return
    geojsonRef.current.eachLayer((layer: L.Layer) => {
      const featureLayer = layer as L.Layer & { feature?: GeoJSON.Feature }
      if (!featureLayer.feature) return
      const codigo = featureLayer.feature.properties?.codigo as string
      const nome = featureLayer.feature.properties?.nome as string
      const score = scoreMap.get(codigo)

      // Update fill style
      ;(layer as L.Path).setStyle({
        fillColor: score ? getScoreLabel(score.overall).color : '#374151',
        fillOpacity: 0.6,
        weight: 1,
        color: '#374151',
      })

      // Update tooltip with current scores
      const tooltipContent = buildTooltipContent(
        nome,
        featureLayer.feature,
        score,
      )
      const tooltipLayer = layer as L.Layer & {
        unbindTooltip: () => void
        bindTooltip: (content: string) => void
      }
      tooltipLayer.unbindTooltip()
      tooltipLayer.bindTooltip(tooltipContent)
    })
  }, [scoreMap])

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

    const tooltipContent = buildTooltipContent(nome, feature, score)
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
        const currentOptions = target.options as L.PathOptions
        target.setStyle({
          weight: 1,
          color: '#374151',
          fillOpacity: 0.6,
          fillColor: currentOptions.fillColor,
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
      ref={geojsonRef}
      key={geojsonKey}
      data={geojsonData}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}
