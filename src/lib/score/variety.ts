import { calculateCentroid } from '@/lib/geo/centroid'
import { haversine } from '@/lib/geo/haversine'
import { findWithinRadius } from '@/lib/geo/nearest'
import type { CategoryScore, GreenArea, ServiceFacility } from '@/lib/types'

function scoreVariety(count: number): number {
  if (count >= 6) return 100
  if (count === 5) return 80
  if (count === 4) return 60
  if (count === 3) return 40
  if (count === 2) return 20
  return 5
}

export function calculateVarietyScore(
  centroid: [number, number],
  services: Record<string, ServiceFacility[]>,
  greenAreas: GreenArea[],
): CategoryScore {
  let count = 0
  const checks: string[] = []

  // Health within 2km
  const healthNearby = findWithinRadius(centroid, services.saude ?? [], 2000)
  if (healthNearby.length > 0) {
    count++
    checks.push('Saúde')
  }

  // Education within 1.5km
  const eduNearby = findWithinRadius(centroid, services.educacao ?? [], 1500)
  if (eduNearby.length > 0) {
    count++
    checks.push('Educação')
  }

  // Security within 3km
  const secNearby = findWithinRadius(centroid, services.seguranca ?? [], 3000)
  if (secNearby.length > 0) {
    count++
    checks.push('Segurança')
  }

  // Transport stops within 500m
  const stops = (services.transporte ?? []).filter(
    (f) => f.subcategory === 'Parada',
  )
  const transportNearby = findWithinRadius(centroid, stops, 500)
  if (transportNearby.length > 0) {
    count++
    checks.push('Transporte')
  }

  // Green area within 1km
  const hasGreenNearby = greenAreas.some((green) => {
    const greenCentroid = calculateCentroid(green.geometry)
    const dist = haversine(
      centroid[0],
      centroid[1],
      greenCentroid[0],
      greenCentroid[1],
    )
    return dist <= 1000
  })
  if (hasGreenNearby) {
    count++
    checks.push('Áreas Verdes')
  }

  // Culture within 2km
  const cultureNearby = findWithinRadius(centroid, services.cultura ?? [], 2000)
  if (cultureNearby.length > 0) {
    count++
    checks.push('Cultura & Esporte')
  }

  const score = scoreVariety(count)

  return {
    category: 'diversidade',
    score,
    factors: [
      {
        name: 'Categorias de serviço presentes',
        score,
        rawValue: `${count}/6`,
        description:
          checks.length > 0
            ? `Presente: ${checks.join(', ')}`
            : 'Nenhuma categoria de serviço próxima',
      },
    ],
  }
}
