'use client'

import 'leaflet/dist/leaflet.css'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { Bairro, BairroScore, ServiceFacility } from '@/lib/types'
import { NeighborhoodLayer } from './neighborhood-layer'
import { RadiusRings } from './radius-rings'
import { ServiceMarkers } from './service-markers'

interface CityMapProps {
  bairros: Bairro[]
  scores: BairroScore[]
  services: Record<string, ServiceFacility[]>
  onSelectBairro: (codigo: string) => void
  searchedPoint: [number, number] | null
  visibleLayers: Set<string>
}

const CURITIBA_CENTER: [number, number] = [-25.4284, -49.2733]
const DEFAULT_ZOOM = 12

const DARK_TILES =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const LIGHT_TILES =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 })
    }
  }, [center, map])
  return null
}

export default function CityMap({
  bairros,
  scores,
  services,
  onSelectBairro,
  searchedPoint,
  visibleLayers,
}: CityMapProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const tileUrl =
    mounted && resolvedTheme === 'light' ? LIGHT_TILES : DARK_TILES

  return (
    <MapContainer
      center={CURITIBA_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        key={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={tileUrl}
      />
      {bairros.length > 0 && (
        <NeighborhoodLayer
          bairros={bairros}
          scores={scores}
          onSelectBairro={onSelectBairro}
        />
      )}
      <ServiceMarkers services={services} visibleLayers={visibleLayers} />
      {searchedPoint && <RadiusRings center={searchedPoint} />}
      <FlyTo center={searchedPoint} />
    </MapContainer>
  )
}
