'use client'

import 'leaflet/dist/leaflet.css'

import { MapContainer, TileLayer } from 'react-leaflet'
import type { Bairro, BairroScore } from '@/lib/types'
import { NeighborhoodLayer } from './neighborhood-layer'

interface CityMapProps {
  bairros: Bairro[]
  scores: BairroScore[]
  onSelectBairro: (codigo: string) => void
}

const CURITIBA_CENTER: [number, number] = [-25.4284, -49.2733]
const DEFAULT_ZOOM = 12

export default function CityMap({
  bairros,
  scores,
  onSelectBairro,
}: CityMapProps) {
  return (
    <MapContainer
      center={CURITIBA_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {bairros.length > 0 && (
        <NeighborhoodLayer
          bairros={bairros}
          scores={scores}
          onSelectBairro={onSelectBairro}
        />
      )}
    </MapContainer>
  )
}
