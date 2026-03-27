'use client'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Pane, useMap } from 'react-leaflet'
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
  panelOpen: boolean
  selectedCentroid?: [number, number] | null
}

const CURITIBA_CENTER: [number, number] = [-25.4284, -49.2733]
const DEFAULT_ZOOM = 12

const DARK_TILES =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const LIGHT_TILES =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

function TileLayerUpdater({ url }: { url: string }) {
  const map = useMap()
  const layerRef = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    if (!layerRef.current) {
      const layer = L.tileLayer(url, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map)
      layerRef.current = layer
    } else {
      layerRef.current.setUrl(url)
    }
  }, [map, url])

  return null
}

function MapResizer({ panelOpen }: { panelOpen: boolean }) {
  const map = useMap()
  // biome-ignore lint/correctness/useExhaustiveDependencies: panelOpen triggers resize intentionally
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300)
    return () => clearTimeout(timer)
  }, [panelOpen, map])
  return null
}

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
  panelOpen,
  selectedCentroid,
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
      scrollWheelZoom={true}
      dragging={true}
      doubleClickZoom={true}
      className="h-full w-full"
    >
      <TileLayerUpdater url={tileUrl} />
      <MapResizer panelOpen={panelOpen} />
      <Pane name="neighborhoodPane" style={{ zIndex: 400 }}>
        {bairros.length > 0 && (
          <NeighborhoodLayer
            bairros={bairros}
            scores={scores}
            onSelectBairro={onSelectBairro}
          />
        )}
      </Pane>
      <Pane name="serviceMarkerPane" style={{ zIndex: 600 }}>
        <ServiceMarkers services={services} visibleLayers={visibleLayers} selectedCentroid={selectedCentroid} />
      </Pane>
      {searchedPoint && <RadiusRings center={searchedPoint} />}
      <FlyTo center={searchedPoint} />
    </MapContainer>
  )
}
