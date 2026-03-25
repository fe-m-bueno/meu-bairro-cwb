export function calculateCentroid(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [number, number] {
  const coords =
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates.flatMap((poly) => poly[0])
      : geometry.coordinates[0]
  const points = coords.slice(0, -1)
  const sumLng = points.reduce((s, c) => s + c[0], 0)
  const sumLat = points.reduce((s, c) => s + c[1], 0)
  return [sumLat / points.length, sumLng / points.length]
}
