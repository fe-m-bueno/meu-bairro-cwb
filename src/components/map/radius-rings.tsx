'use client'

import { Circle, Tooltip } from 'react-leaflet'

interface RadiusRingsProps {
  center: [number, number]
}

const RINGS = [
  {
    radius: 500,
    label: '500m',
    color: '#10b981',
    fillColor: '#10b981',
  },
  {
    radius: 1000,
    label: '1km',
    color: '#3b82f6',
    fillColor: '#3b82f6',
  },
  {
    radius: 2000,
    label: '2km',
    color: '#8b5cf6',
    fillColor: '#8b5cf6',
  },
] as const

export function RadiusRings({ center }: RadiusRingsProps) {
  return (
    <>
      {RINGS.map((ring) => (
        <Circle
          key={ring.radius}
          center={center}
          radius={ring.radius}
          pathOptions={{
            color: ring.color,
            weight: 1.5,
            dashArray: '6 4',
            fillColor: ring.fillColor,
            fillOpacity: 0.06,
          }}
        >
          <Tooltip direction="top" permanent={false}>
            {ring.label}
          </Tooltip>
        </Circle>
      ))}
    </>
  )
}
